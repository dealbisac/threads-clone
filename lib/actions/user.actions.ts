"use server"

import { revalidatePath } from "next/cache";
import User from "../models/user.model";
import { connectToDatabase } from "../mongoose"
import Thread from "../models/thread.model";
import { FilterQuery, SortOrder } from "mongoose";

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

// Fetch post of user
export async function fetchUserPosts(userId: String) {
    connectToDatabase();

    try {
        // Find all threads authored by user with the given userId

        // TODO: Populate communities
        const threads = await User.findOne({ id: userId })
            .populate({
                path: "threads",
                model: Thread,
                populate: {
                    path: "children",
                    model: Thread,
                    populate: {
                        path: "author",
                        model: User,
                        select: "name image id"
                    }
                }
            });

        return threads;
    } catch (error: any) {
        throw new Error(`Failed to fetch user posts: ${error.message}`);
    }
}

// Fetch users
export async function fetchUsers({
    userId,
    searchString,
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc",
}: {
    userId: String,
    searchString?: String,
    pageNumber?: Number,
    pageSize?: Number,
    sortBy?: SortOrder
}) {
    connectToDatabase();

    try {
        const skipAmount = (pageNumber - 1) * pageSize;

        const regex = new RegExp(searchString, "i");

        const query: FilterQuery<typeof User> = {
            id: { $ne: userId },
        }

        if (searchString.trim() !== "") {
            query.$or = [
                { username: { $regex: regex } },
                { name: { $regex: regex } }
            ]
        }

        const sortOptions = { createdAt: sortBy };

        const usersQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize);

        const totalUsersCount = await User.countDocuments(query);

        const users = await usersQuery.exec();

        const isNext = totalUsersCount > skipAmount + users.length;

        return { users, isNext };

    } catch (error: any) {
        throw new Error(`Failed to fetch users: ${error.message}`);
    }
}

