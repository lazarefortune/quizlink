import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      coinBalance: number;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    coinBalance: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    name: string;
    role: string;
    coinBalance: number;
  }
}
