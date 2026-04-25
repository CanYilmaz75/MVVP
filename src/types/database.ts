export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type TableDefinition<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organisations: TableDefinition<
        { id: string; name: string; slug: string; created_at: string },
        { id?: string; name: string; slug: string; created_at?: string },
        { id?: string; name?: string; slug?: string; created_at?: string }
      >;
      profiles: TableDefinition<
        {
          id: string;
          organisation_id: string;
          full_name: string | null;
          role: "clinician" | "admin";
          specialty: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id: string;
          organisation_id: string;
          full_name?: string | null;
          role?: "clinician" | "admin";
          specialty?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          organisation_id?: string;
          full_name?: string | null;
          role?: "clinician" | "admin";
          specialty?: string | null;
          updated_at?: string;
        }
      >;
      note_templates: TableDefinition<
        {
          id: string;
          organisation_id: string;
          name: string;
          specialty: string;
          note_type: string;
          schema_version: string;
          template_definition: Json;
          active: boolean;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          name: string;
          specialty: string;
          note_type?: string;
          schema_version?: string;
          template_definition: Json;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          name?: string;
          specialty?: string;
          note_type?: string;
          schema_version?: string;
          template_definition?: Json;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        }
      >;
      consultations: TableDefinition<
        {
          id: string;
          organisation_id: string;
          clinician_id: string;
          patient_reference: string;
          specialty: string;
          spoken_language: string;
          note_template_id: string | null;
          consultation_type: string | null;
          status: string;
          started_at: string | null;
          ended_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          clinician_id: string;
          patient_reference: string;
          specialty: string;
          spoken_language: string;
          note_template_id?: string | null;
          consultation_type?: string | null;
          status?: string;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          clinician_id?: string;
          patient_reference?: string;
          specialty?: string;
          spoken_language?: string;
          note_template_id?: string | null;
          consultation_type?: string | null;
          status?: string;
          started_at?: string | null;
          ended_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      audio_assets: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string;
          storage_path: string;
          mime_type: string;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          source: "browser_recording" | "upload" | "voice_edit";
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id: string;
          storage_path: string;
          mime_type: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          source: "browser_recording" | "upload" | "voice_edit";
          created_by: string;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string;
          storage_path?: string;
          mime_type?: string;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          source?: "browser_recording" | "upload" | "voice_edit";
          created_by?: string;
          created_at?: string;
        }
      >;
      transcripts: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string;
          audio_asset_id: string;
          provider: string;
          detected_language: string | null;
          raw_text: string;
          confidence: number | null;
          status: "queued" | "processing" | "ready" | "failed";
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id: string;
          audio_asset_id: string;
          provider: string;
          detected_language?: string | null;
          raw_text: string;
          confidence?: number | null;
          status?: "queued" | "processing" | "ready" | "failed";
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string;
          audio_asset_id?: string;
          provider?: string;
          detected_language?: string | null;
          raw_text?: string;
          confidence?: number | null;
          status?: "queued" | "processing" | "ready" | "failed";
          created_at?: string;
        }
      >;
      consultation_additional_texts: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string;
          title: string;
          content: string;
          source_type: "additional_text" | "previous_note" | "intake_form" | "chat";
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id: string;
          title: string;
          content: string;
          source_type?: "additional_text" | "previous_note" | "intake_form" | "chat";
          created_by: string;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string;
          title?: string;
          content?: string;
          source_type?: "additional_text" | "previous_note" | "intake_form" | "chat";
          created_by?: string;
          created_at?: string;
        }
      >;
      transcript_segments: TableDefinition<
        {
          id: string;
          transcript_id: string;
          speaker_label: string | null;
          start_ms: number | null;
          end_ms: number | null;
          text: string;
          segment_index: number;
        },
        {
          id?: string;
          transcript_id: string;
          speaker_label?: string | null;
          start_ms?: number | null;
          end_ms?: number | null;
          text: string;
          segment_index: number;
        },
        {
          id?: string;
          transcript_id?: string;
          speaker_label?: string | null;
          start_ms?: number | null;
          end_ms?: number | null;
          text?: string;
          segment_index?: number;
        }
      >;
      clinical_notes: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string;
          current_version: number;
          status: string;
          structured_json: Json;
          rendered_text: string;
          approved_by: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id: string;
          current_version?: number;
          status?: string;
          structured_json: Json;
          rendered_text: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string;
          current_version?: number;
          status?: string;
          structured_json?: Json;
          rendered_text?: string;
          approved_by?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        }
      >;
      clinical_note_versions: TableDefinition<
        {
          id: string;
          organisation_id: string;
          clinical_note_id: string;
          version_number: number;
          structured_json: Json;
          rendered_text: string;
          change_source: string;
          created_by: string | null;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          clinical_note_id: string;
          version_number: number;
          structured_json: Json;
          rendered_text: string;
          change_source: string;
          created_by?: string | null;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          clinical_note_id?: string;
          version_number?: number;
          structured_json?: Json;
          rendered_text?: string;
          change_source?: string;
          created_by?: string | null;
          created_at?: string;
        }
      >;
      note_edits: TableDefinition<
        {
          id: string;
          organisation_id: string;
          clinical_note_id: string;
          instruction_text: string;
          instruction_source: "voice" | "manual";
          result_summary: string | null;
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          clinical_note_id: string;
          instruction_text: string;
          instruction_source: "voice" | "manual";
          result_summary?: string | null;
          created_by: string;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          clinical_note_id?: string;
          instruction_text?: string;
          instruction_source?: "voice" | "manual";
          result_summary?: string | null;
          created_by?: string;
          created_at?: string;
        }
      >;
      exports: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string;
          clinical_note_id: string;
          note_version_number: number;
          export_type: "pdf" | "clipboard";
          storage_path: string | null;
          created_by: string;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id: string;
          clinical_note_id: string;
          note_version_number: number;
          export_type: "pdf" | "clipboard";
          storage_path?: string | null;
          created_by: string;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string;
          clinical_note_id?: string;
          note_version_number?: number;
          export_type?: "pdf" | "clipboard";
          storage_path?: string | null;
          created_by?: string;
          created_at?: string;
        }
      >;
      audit_logs: TableDefinition<
        {
          id: string;
          organisation_id: string;
          actor_id: string | null;
          entity_type: string;
          entity_id: string | null;
          action: string;
          metadata: Json;
          created_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          actor_id?: string | null;
          entity_type: string;
          entity_id?: string | null;
          action: string;
          metadata?: Json;
          created_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          actor_id?: string | null;
          entity_type?: string;
          entity_id?: string | null;
          action?: string;
          metadata?: Json;
          created_at?: string;
        }
      >;
      jobs: TableDefinition<
        {
          id: string;
          organisation_id: string;
          consultation_id: string | null;
          job_type: string;
          status: "queued" | "processing" | "completed" | "failed";
          payload: Json;
          result: Json | null;
          error_message: string | null;
          attempts: number;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          consultation_id?: string | null;
          job_type: string;
          status?: "queued" | "processing" | "completed" | "failed";
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          consultation_id?: string | null;
          job_type?: string;
          status?: "queued" | "processing" | "completed" | "failed";
          payload?: Json;
          result?: Json | null;
          error_message?: string | null;
          attempts?: number;
          created_at?: string;
          updated_at?: string;
        }
      >;
      feature_flags: TableDefinition<
        {
          id: string;
          organisation_id: string;
          key: string;
          enabled: boolean;
          config: Json;
          created_at: string;
          updated_at: string;
        },
        {
          id?: string;
          organisation_id: string;
          key: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        },
        {
          id?: string;
          organisation_id?: string;
          key?: string;
          enabled?: boolean;
          config?: Json;
          created_at?: string;
          updated_at?: string;
        }
      >;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
