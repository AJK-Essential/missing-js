import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

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
}
