"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDatabase } from "../mongoose"

interface Params {
    userId: String,
    username: String,
    name: String,
    bio: String,
    image: String,
    path: String,
}

// Create or update user
export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path,
}: Params): Promise<void> {
    connectToDatabase();

    try {
        await User.findOneAndUpdate(
            { id: userId },
            {
                username: username.toLowerCase(),
                name,
                image,
                bio,
                onboarded: true,
            },
            { upsert: true }
        );

        if (path === "/profile?edit") {
            revalidatePath("/path");
        }
    } catch (error: any) {
        throw new Error(`Failed to create/update user: ${error.message}`);
    }
}

// Fetch user by ID
export async function fetchUser(userId: String) {
    connectToDatabase();

    try {
        const user = await User.findOne({ id: userId })
            // .populate({
            //     path: "communities",
            //     model: Community
            // });
        return user;
    } catch (error: any) {
        throw new Error(`Failed to fetch user: ${error.message}`);
    }
}
