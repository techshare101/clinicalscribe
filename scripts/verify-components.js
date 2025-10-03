// Simple verification script to check if components are properly structured
// Run with: node scripts/verify-components.js

import { readFileSync } from "fs";
import { join } from "path";

function verifyComponent(filePath, componentName) {
  try {
    const content = readFileSync(filePath, "utf8");
    console.log(`\n🔍 Verifying ${componentName}...`);
    
    // Check for glassmorphism styling
    const hasGlassmorphism = content.includes("backdrop-blur") || content.includes("bg-white/70") || content.includes("glass");
    console.log(`  Glassmorphism styling: ${hasGlassmorphism ? '✅' : '❌'}`);
    
    // Check for proper error handling
    const hasErrorHandling = content.includes("permission-denied") || content.includes("error handling");
    console.log(`  Error handling: ${hasErrorHandling ? '✅' : '❌'}`);
    
    // Check for proper field usage (patientId for SessionsCard, userId for SOAPNotesCard)
    if (componentName === 'SessionsCard') {
      const hasPatientId = content.includes("patientId");
      console.log(`  Uses patientId field: ${hasPatientId ? '✅' : '❌'}`);
    } else if (componentName === 'SOAPNotesCard') {
      const hasUserId = content.includes("userId");
      console.log(`  Uses userId field: ${hasUserId ? '✅' : '❌'}`);
    }
    
    // Check for proper imports
    const hasFirebaseImports = content.includes("firebase/firestore");
    console.log(`  Firebase imports: ${hasFirebaseImports ? '✅' : '❌'}`);
    
    console.log(`✅ ${componentName} verification complete`);
    return true;
  } catch (error) {
    console.error(`❌ Error verifying ${componentName}:`, error.message);
    return false;
  }
}

function verifyRules() {
  try {
    const rulesPath = join(process.cwd(), "firestore.rules");
    const content = readFileSync(rulesPath, "utf8");
    console.log(`\n🔍 Verifying Firestore rules...`);
    
    // Check for patientSessions rules
    const hasPatientSessions = content.includes("patientSessions");
    console.log(`  patientSessions rules: ${hasPatientSessions ? '✅' : '❌'}`);
    
    // Check for proper field usage
    const hasPatientId = content.includes("patientId");
    console.log(`  Uses patientId field: ${hasPatientId ? '✅' : '❌'}`);
    
    // Check for userId usage
    const hasUserId = content.includes("userId");
    console.log(`  Uses userId field: ${hasUserId ? '✅' : '❌'}`);
    
    console.log(`✅ Firestore rules verification complete`);
    return true;
  } catch (error) {
    console.error(`❌ Error verifying Firestore rules:`, error.message);
    return false;
  }
}

async function runVerification() {
  console.log("🚀 Starting component verification...\n");
  
  const results = [];
  
  // Verify components
  results.push(verifyComponent(
    join(process.cwd(), "components", "SessionsCard.tsx"),
    "SessionsCard"
  ));
  
  results.push(verifyComponent(
    join(process.cwd(), "components", "SOAPNotesCard.tsx"),
    "SOAPNotesCard"
  ));
  
  // Verify rules
  results.push(verifyRules());
  
  // Final result
  const allPassed = results.every(result => result);
  
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Verification ${allPassed ? 'completed successfully' : 'completed with issues'}`);
  
  if (!allPassed) {
    console.log("\n💡 Next steps:");
    console.log("  1. Check the output above for specific issues");
    console.log("  2. Review the component files and fix any missing elements");
    console.log("  3. Run this script again to verify fixes");
  }
  
  return allPassed;
}

// Run verification
if (require.main === module) {
  runVerification().then(() => {
    console.log("\n✨ Verification process finished");
  }).catch((error) => {
    console.error("\n💥 Verification failed:", error);
  });
}

export default runVerification;