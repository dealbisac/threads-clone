"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDatabase } from "../mongoose"
import Thread from "../models/thread.model";

interface Params {
    text: String,
    author: String,
    communityID: String | null,
    path: String,
}

// Create or update thread
export async function createThread({
    text,
    author,
    communityID,
    path,
}: Params): Promise<void> {
    connectToDatabase();

    try {
        const createdThread = await Thread.create({
            text,
            author,
            community: null,
        });

        // Update user's threads
        await User.findByIdAndUpdate( author, {
            $push: { threads: createdThread._id } 
        });

        revalidatePath("/path");

    } catch (error: any) {
        throw new Error(`Failed to create/update thread: ${error.message}`);
    }
}

