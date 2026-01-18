import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { RegisterSchema } from "@@/lib/auth/dto";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function POST(req: Request) {
  try {
    // 1. Parse JSON body
    const body = await req.json();

    // 2. Validate with Zod
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.format(),
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // 3. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
        },
        { status: 409 }
      );
    }

    // 4. Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // 5. Create user in database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        // role defaults to USER from schema
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        // NEVER return password
      },
    });

    // Return success response
    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
