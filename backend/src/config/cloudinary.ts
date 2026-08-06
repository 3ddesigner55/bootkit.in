import { v2 as cloudinary } from 'cloudinary';

function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

cloudinary.config({
  cloud_name: readRequiredEnvironmentVariable('CLOUDINARY_CLOUD_NAME'),
  api_key: readRequiredEnvironmentVariable('CLOUDINARY_API_KEY'),
  api_secret: readRequiredEnvironmentVariable('CLOUDINARY_API_SECRET'),
});

export default cloudinary;
