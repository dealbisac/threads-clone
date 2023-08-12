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
        await User.findByIdAndUpdate(author, {
            $push: { threads: createdThread._id }
        });

        // Update community's threads
        revalidatePath(path);

    } catch (error: any) {
        throw new Error(`Failed to create/update thread: ${error.message}`);
    }
}

// Fetch All Threads
export async function fetchPosts(pageNumber = 1, pageSize = 20) {
    connectToDatabase();

    try {
        // Calculate number of posts to skip
        const skipAmount = (pageNumber - 1) * pageSize;

        // Fetch the posts that have no parents (top level threads)
        const postsQuery = Thread.find({ parentId: { $in: [null, undefined] } })
            .sort({ createdAt: 'desc' })
            .skip(skipAmount)
            .limit(pageSize)
            .populate({ path: 'author', model: User })
            .populate({
                path: 'children',
                populate: {
                    path: 'author',
                    model: User,
                    select: "_id name parentId image"
                }
            });

        // Calculate the total number of posts
        const totalPostsCount = await Thread.countDocuments({
            parentId:
                { $in: [null, undefined] }
        });

        // Calculate the total number of pages
        const posts = await postsQuery.exec();

        const isNext = totalPostsCount > skipAmount + posts.length;

        return { posts, isNext };

    } catch (error: any) {
        throw new Error(`Failed to fetch threads: ${error.message}`);
    }
}

