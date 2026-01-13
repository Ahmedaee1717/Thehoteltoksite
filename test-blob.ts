// Test if Blob works in Cloudflare Workers
export default {
  async fetch(request: Request) {
    try {
      const testData = new Uint8Array([1, 2, 3]);
      const blob = new Blob([testData], { type: 'application/octet-stream' });
      return new Response(JSON.stringify({
        success: true,
        blobSize: blob.size,
        blobType: blob.type
      }));
    } catch (error: any) {
      return new Response(JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }), { status: 500 });
    }
  }
};
