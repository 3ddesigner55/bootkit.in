function readRequiredEnvironmentVariable(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }

  return value;
}

export const jwtConfig = {
  accessSecret: readRequiredEnvironmentVariable('JWT_ACCESS_SECRET'),
  refreshSecret: readRequiredEnvironmentVariable('JWT_REFRESH_SECRET'),
  accessExpiresIn: readRequiredEnvironmentVariable('JWT_ACCESS_EXPIRES_IN'),
  refreshExpiresIn: readRequiredEnvironmentVariable('JWT_REFRESH_EXPIRES_IN'),
};
