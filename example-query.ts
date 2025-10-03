'''import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { auth } from "@/lib/firebase"; // Assuming you have an auth export

// Get the currently authenticated user
const user = auth.currentUser;

// The ID of the clinic the user is currently associated with
const clinicId = "your-clinic-id"; // This would typically come from the user's profile or session

// 1. Define the query
const patientsRef = collection(db, `clinics/${clinicId}/patients`);
const q = query(patientsRef, where("status", "==", "Awaiting Summary"));

// 2. Execute the query
async function getPatients() {
  if (!user) {
    console.error("No user is authenticated.");
    return;
  }

  try {
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("No matching patients found.");
      return;
    }

    querySnapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });

  } catch (error) {
    console.error("Error fetching patients:", error);
    // If you see a "Missing or insufficient permissions" error here,
    // it means the user's roles in `/users/{userId}` do not grant access
    // to the specified `clinicId`.
  }
}

// 3. Run the function
getPatients();
''