"use server";
import { db } from "@/src/prisma/db";
export const fetchProfileInformation = async (userId: string) => {
  const response = await db.orm.public.Account.select(
    "username",
    "email",
    "image",
    "createdAt",
  )
    .where({ id: userId })
    .first();

  return response;
};

export const updateProfileImage = async (imageUrl: string, userId: string) => {
  const response = await db.orm.public.Account.where({ id: userId }).update({
    image: imageUrl,
  });

  return response;
};
