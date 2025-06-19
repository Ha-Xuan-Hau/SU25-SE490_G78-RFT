export function login(credentials: {
  email: string;
  password: string;
}): Promise<any>;
export function updateUser(id: string, options?: { body?: any }): Promise<any>;
