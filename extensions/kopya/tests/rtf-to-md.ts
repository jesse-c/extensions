import { execute } from "./exec";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

// Sample RTF content for testing
const sampleRtf = `{\\rtf1\\ansi\\ansicpg1252\\cocoartf2709
\\cocoatextscaling0\\cocoaplatform0{\\fonttbl\\f0\\fswiss\\fcharset0 Helvetica;}
{\\colortbl;\\red255\\green255\\blue255;}
{\\*\\expandedcolortbl;;}
\\paperw11900\\paperh16840\\margl1440\\margr1440\\vieww11520\\viewh8400\\viewkind0
\\pard\\tx566\\tx1133\\tx1700\\tx2267\\tx2834\\tx3401\\tx3968\\tx4535\\tx5102\\tx5669\\tx6236\\tx6803\\pardirnatural\\partightenfactor0

\\f0\\fs24 \\cf0 This is a test RTF document with \\b bold\\b0  and \\i italic\\i0  text.}`;

async function testRtfConversion() {
  const tempDir = tmpdir();
  const tempRtfPath = join(tempDir, `temp-${Date.now()}.rtf`);
  
  try {
    console.log("Writing RTF content to temp file...");
    await writeFile(tempRtfPath, sampleRtf);
    
    console.log("Converting RTF to Markdown using pandoc...");
    const { stdout, stderr } = await execute(`pandoc -f rtf -t markdown "${tempRtfPath}"`);
    
    if (stderr) {
      console.warn("Pandoc warning:", stderr);
    }
    
    console.log("Conversion result:");
    console.log(stdout || "No output");
    
    return stdout || "Conversion failed";
  } catch (error) {
    console.error("Failed to convert RTF:", error);
    return "Error: " + error;
  } finally {
    try {
      await unlink(tempRtfPath);
      console.log("Temp file cleaned up");
    } catch (error) {
      console.error("Failed to clean up temp file:", error);
    }
  }
}

// Run the test
testRtfConversion().then(() => {
  console.log("Test completed");
}).catch(error => {
  console.error("Test failed:", error);
});
