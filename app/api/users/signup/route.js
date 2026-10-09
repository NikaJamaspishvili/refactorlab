import bcrypt from "bcryptjs";
import { connectToMongoDB } from "../../../db/db";

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return Response.json(
        { message: "Username, email, and password are required" },
        { status: 400 },
      );
    }

    const client = await connectToMongoDB();
    const users = client.db("refactorlab").collection("users");

    const existingUser = await users.findOne({ username });

    if (existingUser) {
      return Response.json(
        { message: "Username already exists" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await users.insertOne({
      username,
      email,
      password: hashedPassword,
      createdAt: new Date(),
    });

    return Response.json(
      {
        id: result.insertedId.toString(),
        username,
        email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Signup error:", error);

    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
