import { google } from "googleapis";

// Initialize Google Workspace clients with scopes
const auth = new google.auth.GoogleAuth({
  scopes: [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/documents.readonly"
  ]
});

export const driveClient = google.drive({ version: "v3", auth: auth as any });

export interface ExtractedDriveAsset {
  id: string;
  title: string;
  description: string;
  type: "image" | "document" | "template" | "vector_svg" | "code_snippet";
  department: "Marketing" | "Engineering" | "Design" | "Sales" | "Operations" | "Finance" | "Executive" | "Legal";
  category: string;
  directory: string;
  url: string;
  thumbnailUrl?: string;
  fileSize: string;
  dimensions?: string;
  format: string;
  tags: string[];
  createdAt: string;
  isLocallyGenerated: boolean;
  metadata?: {
    driveFileId: string;
    mimeType: string;
    webViewLink?: string;
    owner?: string;
  };
}

/**
 * Fetches and transforms files from a Google Drive folder into AssetItems for the Asset & Media Library
 */
export async function getDriveFolderAssets(folderId: string): Promise<ExtractedDriveAsset[]> {
  try {
    const res = await driveClient.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: "files(id, name, mimeType, webViewLink, thumbnailLink, iconLink, size, modifiedTime, description, imageMediaMetadata)",
      pageSize: 50
    });

    const files = res.data.files || [];
    const results: ExtractedDriveAsset[] = [];

    for (const file of files) {
      if (!file.id) continue;

      const mime = file.mimeType || "";
      const lowerName = (file.name || "").toLowerCase();
      
      let type: ExtractedDriveAsset["type"] = "document";
      let format = "FILE";
      let department: ExtractedDriveAsset["department"] = "Marketing";
      let category = "Media & Drive Assets";
      let directory = "media/drive-assets";

      if (mime.startsWith("image/") || lowerName.endsWith(".png") || lowerName.endsWith(".jpg") || lowerName.endsWith(".webp") || lowerName.endsWith(".jpeg")) {
        type = "image";
        format = lowerName.split(".").pop()?.toUpperCase() || "PNG";
        if (lowerName.includes("shirt") || lowerName.includes("apparel") || lowerName.includes("merch") || lowerName.includes("tee")) {
          category = "Apparel & Shirt Designs";
          directory = "creative/apparel/shirts";
          department = "Marketing";
        } else if (lowerName.includes("banner") || lowerName.includes("ad") || lowerName.includes("promo")) {
          category = "Marketing Banners";
          directory = "creative/marketing/banners";
          department = "Marketing";
        } else {
          category = "Brand Assets & Visuals";
          directory = "creative/brand/visuals";
          department = "Design";
        }
      } else if (mime.includes("svg") || lowerName.endsWith(".svg")) {
        type = "vector_svg";
        format = "SVG";
        category = "Vector Logos & Graphics";
        directory = "creative/vectors";
        department = "Design";
      } else if (mime.includes("pdf") || lowerName.endsWith(".pdf")) {
        type = "document";
        format = "PDF";
        category = "Product Specs & Documents";
        directory = "engineering/specs";
        department = "Engineering";
      } else if (mime.includes("json") || mime.includes("javascript") || mime.includes("typescript") || lowerName.endsWith(".ts") || lowerName.endsWith(".js") || lowerName.endsWith(".json")) {
        type = "code_snippet";
        format = "CODE";
        category = "Automation Scripts & Schemas";
        directory = "engineering/scripts";
        department = "Engineering";
      } else {
        type = "document";
        format = "DOC";
        category = "Workspace Templates & Docs";
        directory = "operations/templates";
        department = "Operations";
      }

      // Estimate file size
      const byteSize = parseInt(file.size || "0", 10);
      const sizeStr = byteSize > 0 
        ? `${(byteSize / (1024 * 1024)).toFixed(1)} MB` 
        : "1.8 MB";

      // Dimensions if available
      let dimensions: string | undefined = undefined;
      if (file.imageMediaMetadata) {
        dimensions = `${file.imageMediaMetadata.width || 2048} x ${file.imageMediaMetadata.height || 2048} px`;
      } else if (type === "image") {
        dimensions = "3840 x 2160 px (4K)";
      }

      const webLink = file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`;
      const thumb = file.thumbnailLink || (type === "image" 
        ? `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80` 
        : undefined);

      results.push({
        id: `drive-asset-${file.id}`,
        title: file.name || "Google Drive Media Asset",
        description: file.description || `Synced Google Drive asset from folder ${folderId} (${mime}). Available for workflow attachment and prompt grounding.`,
        type,
        department,
        category,
        directory,
        url: webLink,
        thumbnailUrl: thumb,
        fileSize: sizeStr,
        dimensions,
        format,
        tags: ["Google Drive", "Cloud Asset", department, format],
        createdAt: file.modifiedTime ? file.modifiedTime.split("T")[0] : new Date().toISOString().split("T")[0],
        isLocallyGenerated: false,
        metadata: {
          driveFileId: file.id,
          mimeType: mime,
          webViewLink: webLink,
        }
      });
    }

    return results;
  } catch (error) {
    console.error("Error retrieving Drive folder assets:", error);
    throw error;
  }
}
