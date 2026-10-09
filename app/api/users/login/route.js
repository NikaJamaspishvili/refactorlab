import bcrypt from "bcryptjs";
import { connectToMongoDB } from "../../../db/db";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { message: "Username and password are required" },
        { status: 400 },
      );
    }

    const client = await connectToMongoDB();
    const users = client.db("refactorlab").collection("users");

    const user = await users.findOne({ username });

    if (!user) {
      return Response.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    const passwordIsCorrect = await bcrypt.compare(password, user.password);

    if (!passwordIsCorrect) {
      return Response.json(
        { message: "Invalid username or password" },
        { status: 401 },
      );
    }

    return Response.json(
      {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Login error:", error);

    return Response.json({ message: "Internal server error" }, { status: 500 });
  }
}
