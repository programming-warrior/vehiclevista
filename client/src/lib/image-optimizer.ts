export async function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create elements
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Handle image load
    img.onload = () => {
      try {
        // Calculate new dimensions (max 1200x800 while maintaining aspect ratio)
        let width = img.width;
        let height = img.height;

        if (width > 1200) {
          height = (height * 1200) / width;
          width = 1200;
        }

        if (height > 800) {
          width = (width * 800) / height;
          height = 800;
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and optimize
        ctx?.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality 0.8
        const optimizedUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(optimizedUrl);
      } catch (error) {
        console.error('Image optimization failed:', error);
        // Fallback to original file if optimization fails
        resolve(URL.createObjectURL(file));
      }
    };

    // Handle load error
    img.onerror = () => {
      console.error('Failed to load image');
      resolve(URL.createObjectURL(file));
    };

    // Load image
    img.src = URL.createObjectURL(file);
  });
}

export async function optimizeImages(files: FileList): Promise<string[]> {
  const optimizedUrls: string[] = [];

  for (const file of Array.from(files)) {
    const optimizedUrl = await optimizeImage(file);
    optimizedUrls.push(optimizedUrl);
  }

  return optimizedUrls;
}