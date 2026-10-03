import { supabase } from "../supabase";
import commonUtil from "../utils/common-util";

class ProgramSupabaseService {
  mapProgram(row) {
    return {
      id: row.id,
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      startTime: String(row.start_time || "").slice(0, 5),
      endTime: String(row.end_time || "").slice(0, 5),
      description: row.description || "",
      link: row.link || "",
      linkRef: row.link_ref || "",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async resolveDestination(program) {
    if (program.link) {
      return {
        ...program,
        destination: program.link,
      };
    }

    if (!program.linkRef) {
      return {
        ...program,
        destination: "",
      };
    }

    const { data, error } = await supabase.from("links").select("landing_url").eq("slug", program.linkRef).maybeSingle();

    if (error) {
      throw error;
    }

    return {
      ...program,
      destination: data?.landing_url || "",
    };
  }

  async listPrograms() {
    try {
      const { data, error } = await supabase.from("programs").select("*").order("start_date", { ascending: true });

      if (error) {
        throw error;
      }

      const programs = await Promise.all(
        (data || []).map(async (row) => {
          const program = this.mapProgram(row);
          return this.resolveDestination(program);
        }),
      );

      return {
        success: true,
        programs,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        programs: [],
        error: error.message || "Unable to load programs.",
      };
    }
  }

  async getProgram(id) {
    try {
      const { data, error } = await supabase.from("programs").select("*").eq("id", id).maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return {
          success: false,
          program: null,
          error: "Program not found.",
        };
      }

      return {
        success: true,
        program: this.mapProgram(data),
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        program: null,
        error: error.message || "Unable to load program.",
      };
    }
  }

  validateFields({ name, startDate, endDate, startTime, endTime, link, linkRef }) {
    const cleanName = String(name || "").trim();
    const cleanStartDate = String(startDate || "").trim();
    const cleanEndDate = String(endDate || "").trim();
    const cleanStartTime = String(startTime || "").trim();
    const cleanEndTime = String(endTime || "").trim();
    const cleanLink = String(link || "").trim();
    const cleanLinkRef = String(linkRef || "").trim();

    if (!cleanName) {
      return {
        valid: false,
        error: "Enter a program name.",
      };
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanStartDate) || !/^\d{4}-\d{2}-\d{2}$/.test(cleanEndDate)) {
      return {
        valid: false,
        error: "Choose valid start and end dates.",
      };
    }

    if (cleanEndDate < cleanStartDate) {
      return {
        valid: false,
        error: "End date must be on or after the start date.",
      };
    }

    if (!/^\d{2}:\d{2}$/.test(cleanStartTime) || !/^\d{2}:\d{2}$/.test(cleanEndTime)) {
      return {
        valid: false,
        error: "Choose valid start and end times.",
      };
    }

    if (cleanEndDate === cleanStartDate && cleanEndTime < cleanStartTime) {
      return {
        valid: false,
        error: "End time must be after the start time.",
      };
    }

    if (cleanLink && !commonUtil.validateUrl(cleanLink)) {
      return {
        valid: false,
        error: "Enter a valid http/https program link.",
      };
    }

    if (cleanLinkRef && !commonUtil.slugIsValid(cleanLinkRef)) {
      return {
        valid: false,
        error: "Enter a valid linked link ending.",
      };
    }

    return {
      valid: true,
      error: null,
      fields: {
        name: cleanName,
        start_date: cleanStartDate,
        end_date: cleanEndDate,
        start_time: cleanStartTime,
        end_time: cleanEndTime,
        description: String(arguments[0]?.description || "").trim(),
        link: cleanLink,
        link_ref: cleanLinkRef,
      },
    };
  }

  async createProgram({ name, startDate, endDate, startTime, endTime, description, link, linkRef }) {
    const validation = this.validateFields({
      name,
      startDate,
      endDate,
      startTime,
      endTime,
      link,
      linkRef,
      description,
    });

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const fields = {
      ...validation.fields,
      description: String(description || "").trim(),
    };

    try {
      const { data, error } = await supabase.from("programs").insert(fields).select("id").single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        id: data.id,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message || "Unable to create program.",
      };
    }
  }

  async updateProgram(id, fields) {
    const validation = this.validateFields(fields);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    const updateFields = {
      ...validation.fields,
      description: String(fields.description || "").trim(),
      updated_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("programs").update(updateFields).eq("id", id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message || "Unable to update program.",
      };
    }
  }

  async deleteProgram(id) {
    try {
      const { error } = await supabase.from("programs").delete().eq("id", id);

      if (error) {
        throw error;
      }

      return {
        success: true,
        error: null,
      };
    } catch (error) {
      console.error(error);

      return {
        success: false,
        error: error.message || "Unable to delete program.",
      };
    }
  }
}

const programSupabaseService = new ProgramSupabaseService();

export default programSupabaseService;
