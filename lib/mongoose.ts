import mongoose from 'mongoose';

let isConnected: boolean = false; // Singleton variable to check id mongoose is connected or not

export const connectToDatabase = async () => {
    mongoose.set('strictQuery', false);
     
    if(!process.env.MONGODB_URL) return console.log("MONGODB_URL not found");
    if(isConnected) return console.log("Already connected to database");

    try {
        await mongoose.connect(process.env.MONGODB_URL);
        
        isConnected = true;
        console.log("Connected to database");
    } catch (error) {
        console.log(error);
    }
}
