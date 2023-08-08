import mongoose from 'mongoose';

let isConnected: boolean = false; // Singleton variable to check id mongoose is connected or not

export const connectToDatabase = async () => {
    mongoose.set('strictQuery', false);
     
    if(!process.env.MONGODB_URL) return console.log("MONGODB_URL not found");
    if(isConnected) return console.log("Already connected to database");

    try {
    } catch (error) {
        console.log(error);
    }
}
