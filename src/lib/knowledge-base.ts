
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'src/data/uploads');

export function getSystemInstructions(): string {
    if (!fs.existsSync(UPLOADS_DIR)) {
        console.warn('Knowledge Base directory not found:', UPLOADS_DIR);
        return '';
    }

    try {
        const files = fs.readdirSync(UPLOADS_DIR).filter(file => file.endsWith('.md'));

        if (files.length === 0) {
            return '';
        }

        let combinedInstructions = "--- KNOWLEDGE BASE & INSTRUCTIONS ---\n\n";

        for (const file of files) {
            const filePath = path.join(UPLOADS_DIR, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            combinedInstructions += `\n\n--- FILE: ${file} ---\n${content}\n`;
        }

        return combinedInstructions;
    } catch (error) {
        console.error('Failed to read knowledge base:', error);
        return '';
    }
}
