const fs = require("fs");
const path = require("path");

const openers = [
  "I don't know who needs to hear this but",
  "Is it just me or",
  "Actually",
  "Can we stop",
  "Normalize",
  "Life update:",
  "My favorite thing about this city is",
  "Nothing beats",
  "I’m convinced that",
  "If you think about it,",
];
const topics = [
  "the way people drive in the rain",
  "iced coffee in the middle of winter",
  "waking up before your alarm",
  "ordering delivery and then standing by the door",
  "watching a show you've already seen 10 times",
  "the feeling of fresh sheets",
  "trying to stay hydrated",
  "going to the gym for 20 minutes and calling it a day",
];
const closers = [
  "is literally top tier.",
  "is a red flag.",
  "is actually a vibe.",
  "is exhausting.",
  "should be illegal.",
  "is the highlight of my week.",
  "really changed my perspective.",
];
const hashtags = [
  "#relatable",
  "#mood",
  "#daily",
  "#vibes",
  "#thoughts",
  "#truth",
  "#weekend",
];

const generateMessage = () => {
  const roll = Math.random();

  // 15% chance of a "Long Story" (Stress test for large height variations)
  if (roll > 0.85) {
    return `Story time. So I was at the store today and I saw this person doing something so confusing I had to stop and stare. Basically, they were trying to return an item they clearly didn't buy there, and they were arguing with the manager for like 20 minutes.\n\nI was just standing there with my bread and milk like... is this real life? Anyway, I ended up leaving without saying anything but I've been thinking about it all day. People are wild. \n\n#storytime #wild #unbelievable`;
  }

  // 60% chance of a standard thought
  if (roll > 0.25) {
    const msg = `${openers[Math.floor(Math.random() * openers.length)]} ${topics[Math.floor(Math.random() * topics.length)]} ${closers[Math.floor(Math.random() * closers.length)]}`;
    return Math.random() > 0.5
      ? `${msg} ${hashtags[Math.floor(Math.random() * hashtags.length)]}`
      : msg;
  }

  // 25% chance of a "Reaction" (Short height)
  const quickTakes = [
    "I'm screaming. 😂",
    "This.",
    "Rent free in my head.",
    "Delete this immediately.",
    "I feel attacked.",
    "Big mood.",
    "Wait, hold on...",
    "No lies detected.",
    "How is this so accurate?",
    "Exactly what I was saying!",
  ];
  return quickTakes[Math.floor(Math.random() * quickTakes.length)];
};

const generateFormattedNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
};

// ... (keep your openers, topics, closers, hashtags, and generateMessage function from the previous code) ...

const TOTAL_POSTS = 1000000;
const POSTS_PER_FILE = 100000;
const NUM_FILES = TOTAL_POSTS / POSTS_PER_FILE;

function generateCSVChunks() {
  const outputDir = path.join(__dirname, "../examples/angular-demo/public");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

  for (let fileIndex = 0; fileIndex < NUM_FILES; fileIndex++) {
    const fileName = `posts_chunk_${fileIndex + 1}.csv`;
    const stream = fs.createWriteStream(path.join(outputDir, fileName));

    // CSV Header
    // Added 'isLast' column: 0 for false, 1 for true
    stream.write("cardNumber,textContent,likes,comments,reshares,isLast\n");

    for (let i = 0; i < POSTS_PER_FILE; i++) {
      const globalIndex = fileIndex * POSTS_PER_FILE + i;
      const cardNumber = globalIndex + 1;

      // Escape quotes in textContent for CSV safety
      const rawMessage = generateMessage();
      const escapedMessage = `"${rawMessage.replace(/"/g, '""')}"`;

      const likes = generateFormattedNumber(Math.floor(Math.random() * 120000));
      const comments = generateFormattedNumber(
        Math.floor(Math.random() * 15000),
      );
      const reshares = generateFormattedNumber(
        Math.floor(Math.random() * 8000),
      );

      // Only the 1,000,000th post gets the '1' (true)
      const isLast = cardNumber === TOTAL_POSTS ? 1 : 0;

      const row = `${cardNumber},${escapedMessage},${likes},${comments},${reshares},${isLast}\n`;
      stream.write(row);
    }

    stream.end();
    console.log(`Finished ${fileName}...`);
  }
}

generateCSVChunks();
