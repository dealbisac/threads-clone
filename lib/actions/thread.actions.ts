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


// Fetch A Thread By ID
export async function fetchThreadById(id: string) {
    connectToDatabase();

    try {

        // TODO: Populate Community
        const thread = await Thread.findById(id)
            .populate({
                path: 'author',
                model: User,
                select: "_id id name image"
            })
            .populate({
                path: 'children',
                populate: [
                    {
                        path: 'author',
                        model: User,
                        select: "_id id name parentId image"
                    },
                    {
                        path: 'children',
                        model: Thread,
                        populate: {
                            path: 'author',
                            model: User,
                            select: "_id id name parentId image"
                        }
                    }
                ]
            }).exec();

        return thread;

    } catch (error: any) {
        throw new Error(`Failed to fetch thread: ${error.message}`);
    }
}

// Add a reply to a thread
export async function addCommentToThread(
    threadId: string,
    commentText: string,
    userId: string,
    path: string,
) {
    connectToDatabase();

    try {
        // Find the original thread by its ID
        const originalThread = await Thread.findById(threadId);

        if (!originalThread) {
            throw new Error("Thread not found");
        }

        // Create a new thread for the reply
        const newThread = await Thread.create({
            text: commentText,
            author: userId,
            parentId: threadId,
        });

        // Save the new thread
        const savedThread = await newThread.save();

        // Update the original thread's children
        originalThread.children.push(savedThread._id);

        // Save the original thread
        await originalThread.save();

        revalidatePath(path);
    } catch (error: any) {
        throw new Error(`Failed to add comment to thread: ${error.message}`);
    }
}

