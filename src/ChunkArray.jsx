export default function chunkArray (array = [], chunkSize = 1) {
    const chunks = [];
    const arrayToChunk = [...array];
    
    if (chunkSize <= 0) {
      return array;
    }
  
    while (arrayToChunk.length) {
      chunks.push(arrayToChunk.splice(0, chunkSize));
    }
  
    return chunks;
  };
