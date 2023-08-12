"user server"

import { connectToDatabase } from "../mongoose"

 export async function updateUser(): Promise<void>{
    connectToDatabase();
 }