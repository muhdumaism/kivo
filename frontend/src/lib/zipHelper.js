import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Creates a new empty JSZip instance.
 */
export function createZip() {
  return new JSZip();
}

/**
 * Generates and downloads a ZIP file from a JSZip instance.
 * @param {JSZip} zip - The JSZip instance to generate from.
 * @param {string} filename - The name of the file to save (e.g. "my-pack.zip").
 */
export async function downloadZip(zip, filename) {
  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Failed to generate zip:", error);
    throw error;
  }
}

/**
 * Parses an existing ZIP file blob/file into a JSZip instance.
 * @param {File|Blob} file 
 */
export async function loadZip(file) {
  const zip = new JSZip();
  await zip.loadAsync(file);
  return zip;
}
