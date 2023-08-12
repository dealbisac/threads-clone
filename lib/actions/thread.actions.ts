"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDatabase } from "../mongoose"
import Thread from "../models/thread.model";

interface Params {
    text: string,
    author: string,
    communityID: string | null,
    path: string,
}

// Create or update thread
export async function createThread({
    text,
    author,
    communityID,
    path
}: Params) {
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

        // Update community's threads
        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Failed to create/update thread: ${error.message}`);
    }
}

