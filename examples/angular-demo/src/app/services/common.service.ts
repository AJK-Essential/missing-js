import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, bufferTime, filter } from 'rxjs';
import { Message } from '../interfaces/message.interface';

@Injectable({ providedIn: 'root' })
export class CommonService {
  private http = inject(HttpClient);
  getData() {
    return this.http.get('./real_life_tweets.json');
  }

  createBucketsOf<T>(bucketSize: number, data: T[]): T[][] {
    const count = Math.ceil(data.length / bucketSize);
    const a: T[][] = [];
    for (let i = 0; i < count; ++i) {
      a.push(data.slice(i * bucketSize, Math.min(i * bucketSize + bucketSize, data.length)));
    }
    return [...a];
  }

  streamPosts(url: string): Observable<Message[]> {
    return new Observable<Message>((observer) => {
      const controller = new AbortController();

      (async () => {
        try {
          const response = await fetch(url, { signal: controller.signal });
          const reader = response.body?.getReader();
          const decoder = new TextDecoder('utf-8');

          let leftover = ''; // This is the "Safe" for partial lines
          let isFirstLine = true;
          let count = 0;

          if (!reader) return observer.complete();

          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              // Very important: Process the final leftover bit if it exists
              if (leftover.trim()) {
                this.parseLine(leftover, observer);
              }
              break;
            }

            // 1. Decode current chunk and add leftover from previous
            const chunk = decoder.decode(value, { stream: true });
            const lines = (leftover + chunk).split('\n');

            // 2. The last element is ALWAYS potentially incomplete.
            // Pull it out and save it for the next 'read()'.
            leftover = lines.pop() || '';

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;

              if (isFirstLine) {
                isFirstLine = false;
                continue;
              }

              this.parseLine(cleanLine, observer);
              count++;
            }
          }
          console.log(`Stream finished. Total items parsed: ${count}`);
          observer.complete();
        } catch (err: unknown) {
          // 1. Check if it's actually an Error object
          if (err instanceof Error) {
            // 2. Only report it if it wasn't a deliberate user cancelation
            if (err.name !== 'AbortError') {
              observer.error(err);
            }
          } else {
            // 3. Handle cases where something weird (not an Error) was thrown
            observer.error(new Error(String(err)));
          }
        }
      })();

      return () => controller.abort();
    }).pipe(
      // Use bufferCount for stability, or keep bufferTime(100)
      // but we must ensure the final items aren't dropped.
      bufferTime(100, undefined, undefined),
      filter((batch) => batch && batch.length > 0),
    );
  }

  private parseLine(line: string, observer: any) {
    // .split('|') is a native, lightning-fast browser operation
    const parts = line.split('|');
    if (parts.length >= 6) {
      observer.next({
        cardNumber: parseInt(parts[0]),
        textContent: parts[1], // No more .replace() or regex needed!
        likes: parts[2],
        comments: parts[3],
        reshares: parts[4],
        isLast: parts[5].trim() === '1',
      });
    }
  }
}
