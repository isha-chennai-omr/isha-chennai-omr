import { supabase } from "../supabase";

import commonUtil from "../utils/common-util";
import fileUtil from "../utils/file-util";

class LinkSupabaseService {
  constructor() {
    this.linkTable = "links";
    this.storageBucket = "preview-images";
  }

  offlineMessage() {
    return "You appear to be offline. Please connect to the internet and try again.";
  }

  async checkSlugAvailability(slug) {
    const clean = String(slug || "").trim();

    if (!navigator.onLine) {
      return {
        available: false,
        error: this.offlineMessage(),
      };
    }

    if (!commonUtil.slugIsValid(clean)) {
      return {
        available: false,
        error: "Use 3–64 characters: letters, numbers, _ or -.",
      };
    }

    try {
      const { data, error } = await supabase.from(this.linkTable).select("slug").eq("slug", clean).maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        return {
          available: false,
          error: "That link ending is already in use.",
        };
      }

      return {
        available: true,
        error: null,
      };
    } catch (error) {
      return {
        available: false,
        error: error.message || "Failed to check availability.",
      };
    }
  }

  async uploadImage(slug, file) {
    const validation = fileUtil.validateFile(file);

    if (!validation.valid) {
      return {
        success: false,
        path: null,
        url: null,
        error: validation.error,
      };
    }

    const filename = fileUtil.sanitizeFilename(file.name);
    const uniqueName = `${Date.now()}-${filename}`;
    const path = `${slug}/${uniqueName}`;

    const { error } = await supabase.storage.from(this.storageBucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      return {
        success: false,
        path: null,
        url: null,
        error: error.message || "Unable to upload preview image.",
      };
    }

    const { data } = supabase.storage.from(this.storageBucket).getPublicUrl(path);

    return {
      success: true,
      path,
      url: data.publicUrl,
      error: null,
    };
  }

  async deleteImage(path) {
    if (!path) {
      return;
    }

    const { error } = await supabase.storage.from(this.storageBucket).remove([path]);

    if (error) {
      console.error("Unable to delete storage image:", error);
    }
  }

  async generateLink({ slug, description, landingUrl, file }) {
    const clean = String(slug || "").trim();

    if (!navigator.onLine) {
      return {
        success: false,
        url: null,
        error: this.offlineMessage(),
      };
    }

    if (!commonUtil.slugIsValid(clean)) {
      return {
        success: false,
        url: null,
        error: "Use 3–64 characters: letters, numbers, _ or -.",
      };
    }

    if (!commonUtil.validateUrl(landingUrl)) {
      return {
        success: false,
        url: null,
        error: "Enter a valid http/https landing URL.",
      };
    }

    if (!file) {
      return {
        success: false,
        url: null,
        error: "Please upload a preview image.",
      };
    }

    try {
      const { data: existing, error: existingError } = await supabase.from(this.linkTable).select("slug").eq("slug", clean).maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        return {
          success: false,
          url: null,
          error: "That link ending is already in use.",
        };
      }

      const image = await this.uploadImage(clean, file);

      if (!image.success) {
        return {
          success: false,
          url: null,
          error: image.error,
        };
      }

      const { error } = await supabase.from(this.linkTable).insert({
        slug: clean,
        name: clean,
        description: String(description || "").trim(),
        landing_url: landingUrl.toString(),
        image_path: image.path,
      });

      if (error) {
        await this.deleteImage(image.path);
        throw error;
      }

      const generatedUrl = `${window.location.origin}/p/${encodeURIComponent(clean)}`;

      return {
        success: true,
        url: generatedUrl,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        url: null,
        error: error.message || "Something went wrong.",
      };
    }
  }

  async getLink(slug) {
    const clean = String(slug || "").trim();

    try {
      const { data, error } = await supabase.from(this.linkTable).select("*").eq("slug", clean).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          link: null,
          imageData: "",
          error: "Link not found.",
        };
      }

      let imageData = "";

      if (data.image_path) {
        const { data: imageUrlData } = supabase.storage.from(this.storageBucket).getPublicUrl(data.image_path);

        imageData = imageUrlData.publicUrl;
      }

      return {
        success: true,
        link: {
          id: data.slug,
          slug: data.slug,
          name: data.name,
          description: data.description || "",
          link: data.landing_url,
          landingUrl: data.landing_url,
          imagePath: data.image_path,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        imageData,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        link: null,
        imageData: "",
        error: error.message || "Failed to load link.",
      };
    }
  }

  async listLinks() {
    try {
      const { data, error } = await supabase.from(this.linkTable).select("*").order("name", { ascending: true });

      if (error) {
        throw error;
      }

      const links = (data || []).map((row) => ({
        id: row.slug,
        slug: row.slug,
        name: row.name,
        description: row.description || "",
        link: row.landing_url,
        landingUrl: row.landing_url,
        imagePath: row.image_path,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      return {
        success: true,
        links,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        links: [],
        error: error.message || "Failed to load links.",
      };
    }
  }

  async updateLink({ slug, name, description, landingUrl, file }) {
    const clean = String(slug || "").trim();
    const newName = String(name || "").trim();

    if (!commonUtil.slugIsValid(newName)) {
      return {
        success: false,
        error: "Use 3–64 characters: letters, numbers, _ or -.",
      };
    }

    const target = commonUtil.validateUrl(landingUrl);

    if (!target) {
      return {
        success: false,
        error: "Enter a valid http/https landing URL.",
      };
    }

    try {
      const { data: existing, error: existingError } = await supabase.from(this.linkTable).select("*").eq("slug", clean).maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (!existing) {
        return {
          success: false,
          error: "Link not found.",
        };
      }

      if (newName !== clean) {
        const { data: conflictingLink, error: conflictError } = await supabase
          .from(this.linkTable)
          .select("slug")
          .eq("slug", newName)
          .maybeSingle();

        if (conflictError) {
          throw conflictError;
        }

        if (conflictingLink) {
          return {
            success: false,
            error: "That new link ending is already in use.",
          };
        }
      }

      let imagePath = existing.image_path;
      let uploadedNewImage = null;

      if (file) {
        const image = await this.uploadImage(newName, file);

        if (!image.success) {
          return {
            success: false,
            error: image.error,
          };
        }

        uploadedNewImage = image.path;
        imagePath = image.path;
      }

      const { error: updateError } = await supabase
        .from(this.linkTable)
        .update({
          slug: newName,
          name: newName,
          description: String(description || "").trim(),
          landing_url: target.toString(),
          image_path: imagePath,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", clean);

      if (updateError) {
        if (uploadedNewImage) {
          await this.deleteImage(uploadedNewImage);
        }

        throw updateError;
      }

      if (existing.image_path && existing.image_path !== imagePath) {
        await this.deleteImage(existing.image_path);
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message || "Failed to update link.",
      };
    }
  }

  async deleteLink(slug) {
    const clean = String(slug || "").trim();

    try {
      const { data: existing, error: existingError } = await supabase
        .from(this.linkTable)
        .select("image_path")
        .eq("slug", clean)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (!existing) {
        return {
          success: false,
          error: "Link not found.",
        };
      }

      const { error: deleteError } = await supabase.from(this.linkTable).delete().eq("slug", clean);

      if (deleteError) {
        throw deleteError;
      }

      if (existing.image_path) {
        await this.deleteImage(existing.image_path);
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message || "Failed to delete link.",
      };
    }
  }
}

const linkSupabaseService = new LinkSupabaseService();

export default linkSupabaseService;
