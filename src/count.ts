import path from "path";
import fs from "fs";

main();

function main() {
    const fileName = process.argv[2];
    const filePath = path.join(__dirname, "..", "data", fileName);
    console.log(`Counting problems in ${filePath}`);
    console.log(JSON.parse(fs.readFileSync(filePath, "utf8")).length);
}
