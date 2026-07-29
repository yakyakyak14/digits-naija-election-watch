// Generated from the live Supabase schema. Do not edit by hand.
// Refresh with: npm run types:supabase

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          actor_label: string | null;
          created_at: string;
          detail: Json;
          entity: string;
          entity_id: string | null;
          id: number;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          actor_label?: string | null;
          created_at?: string;
          detail?: Json;
          entity: string;
          entity_id?: string | null;
          id?: number;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          actor_label?: string | null;
          created_at?: string;
          detail?: Json;
          entity?: string;
          entity_id?: string | null;
          id?: number;
        };
        Relationships: [];
      };
      broadcast_state: {
        Row: {
          headline: string | null;
          id: boolean;
          is_public_live: boolean;
          slot_1: string | null;
          slot_2: string | null;
          slot_3: string | null;
          slot_4: string | null;
          slot_5: string | null;
          slot_6: string | null;
          ticker_message: string | null;
          tile_count: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          headline?: string | null;
          id?: boolean;
          is_public_live?: boolean;
          slot_1?: string | null;
          slot_2?: string | null;
          slot_3?: string | null;
          slot_4?: string | null;
          slot_5?: string | null;
          slot_6?: string | null;
          ticker_message?: string | null;
          tile_count?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          headline?: string | null;
          id?: boolean;
          is_public_live?: boolean;
          slot_1?: string | null;
          slot_2?: string | null;
          slot_3?: string | null;
          slot_4?: string | null;
          slot_5?: string | null;
          slot_6?: string | null;
          ticker_message?: string | null;
          tile_count?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "broadcast_state_slot_1_fkey";
            columns: ["slot_1"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_state_slot_2_fkey";
            columns: ["slot_2"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_state_slot_3_fkey";
            columns: ["slot_3"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_state_slot_4_fkey";
            columns: ["slot_4"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_state_slot_5_fkey";
            columns: ["slot_5"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "broadcast_state_slot_6_fkey";
            columns: ["slot_6"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
        ];
      };
      digeo_applications: {
        Row: {
          accepted_code_of_conduct: boolean;
          accepted_data_policy: boolean;
          availability: string;
          created_at: string;
          date_of_birth: string;
          declared_non_partisan: boolean;
          email: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          full_name: string;
          gender: string;
          has_prior_observation: boolean;
          has_smartphone: boolean;
          highest_education: string;
          id: string;
          is_party_affiliated: boolean;
          languages: string[];
          latitude: number | null;
          lga: string;
          longitude: number | null;
          motivation: string | null;
          nin: string;
          occupation: string | null;
          party_affiliation_detail: string | null;
          phone: string;
          preferred_polling_unit: string | null;
          prior_observation_detail: string | null;
          residential_address: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          signature_name: string;
          signed_at: string;
          state: string;
          status: string;
          updated_at: string;
          user_id: string;
          ward: string | null;
        };
        Insert: {
          accepted_code_of_conduct?: boolean;
          accepted_data_policy?: boolean;
          availability: string;
          created_at?: string;
          date_of_birth: string;
          declared_non_partisan?: boolean;
          email: string;
          emergency_contact_name: string;
          emergency_contact_phone: string;
          full_name: string;
          gender: string;
          has_prior_observation?: boolean;
          has_smartphone?: boolean;
          highest_education: string;
          id?: string;
          is_party_affiliated?: boolean;
          languages?: string[];
          latitude?: number | null;
          lga: string;
          longitude?: number | null;
          motivation?: string | null;
          nin: string;
          occupation?: string | null;
          party_affiliation_detail?: string | null;
          phone: string;
          preferred_polling_unit?: string | null;
          prior_observation_detail?: string | null;
          residential_address: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          signature_name: string;
          signed_at?: string;
          state: string;
          status?: string;
          updated_at?: string;
          user_id: string;
          ward?: string | null;
        };
        Update: {
          accepted_code_of_conduct?: boolean;
          accepted_data_policy?: boolean;
          availability?: string;
          created_at?: string;
          date_of_birth?: string;
          declared_non_partisan?: boolean;
          email?: string;
          emergency_contact_name?: string;
          emergency_contact_phone?: string;
          full_name?: string;
          gender?: string;
          has_prior_observation?: boolean;
          has_smartphone?: boolean;
          highest_education?: string;
          id?: string;
          is_party_affiliated?: boolean;
          languages?: string[];
          latitude?: number | null;
          lga?: string;
          longitude?: number | null;
          motivation?: string | null;
          nin?: string;
          occupation?: string | null;
          party_affiliation_detail?: string | null;
          phone?: string;
          preferred_polling_unit?: string | null;
          prior_observation_detail?: string | null;
          residential_address?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          signature_name?: string;
          signed_at?: string;
          state?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      digeo_certificates: {
        Row: {
          average_score: number | null;
          certificate_number: string;
          expires_at: string | null;
          full_name: string;
          id: string;
          issued_at: string;
          lga: string | null;
          qr_code_hash: string;
          revoked_at: string | null;
          revoked_reason: string | null;
          state: string;
          user_id: string;
        };
        Insert: {
          average_score?: number | null;
          certificate_number: string;
          expires_at?: string | null;
          full_name: string;
          id?: string;
          issued_at?: string;
          lga?: string | null;
          qr_code_hash: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          state: string;
          user_id: string;
        };
        Update: {
          average_score?: number | null;
          certificate_number?: string;
          expires_at?: string | null;
          full_name?: string;
          id?: string;
          issued_at?: string;
          lga?: string | null;
          qr_code_hash?: string;
          revoked_at?: string | null;
          revoked_reason?: string | null;
          state?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      digeo_deployments: {
        Row: {
          assigned_by: string | null;
          checked_in_at: string | null;
          checked_in_lat: number | null;
          checked_in_lng: number | null;
          created_at: string;
          election_date: string;
          election_name: string;
          id: string;
          latitude: number | null;
          lga: string;
          livekit_room: string | null;
          longitude: number | null;
          notes: string | null;
          observer_id: string;
          polling_unit_code: string | null;
          polling_unit_name: string;
          reporting_time: string;
          state: string;
          status: string;
          supervisor_name: string | null;
          supervisor_phone: string | null;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          assigned_by?: string | null;
          checked_in_at?: string | null;
          checked_in_lat?: number | null;
          checked_in_lng?: number | null;
          created_at?: string;
          election_date: string;
          election_name: string;
          id?: string;
          latitude?: number | null;
          lga: string;
          livekit_room?: string | null;
          longitude?: number | null;
          notes?: string | null;
          observer_id: string;
          polling_unit_code?: string | null;
          polling_unit_name: string;
          reporting_time?: string;
          state: string;
          status?: string;
          supervisor_name?: string | null;
          supervisor_phone?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          checked_in_at?: string | null;
          checked_in_lat?: number | null;
          checked_in_lng?: number | null;
          created_at?: string;
          election_date?: string;
          election_name?: string;
          id?: string;
          latitude?: number | null;
          lga?: string;
          livekit_room?: string | null;
          longitude?: number | null;
          notes?: string | null;
          observer_id?: string;
          polling_unit_code?: string | null;
          polling_unit_name?: string;
          reporting_time?: string;
          state?: string;
          status?: string;
          supervisor_name?: string | null;
          supervisor_phone?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      digeo_trainee_progress: {
        Row: {
          answers: Json;
          attempts: number;
          completed_at: string | null;
          id: string;
          module_id: string;
          quiz_score: number | null;
          started_at: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          answers?: Json;
          attempts?: number;
          completed_at?: string | null;
          id?: string;
          module_id: string;
          quiz_score?: number | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          answers?: Json;
          attempts?: number;
          completed_at?: string | null;
          id?: string;
          module_id?: string;
          quiz_score?: number | null;
          started_at?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "digeo_trainee_progress_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "digeo_training_modules";
            referencedColumns: ["id"];
          },
        ];
      };
      digeo_training_modules: {
        Row: {
          category: string;
          content_markdown: string;
          created_at: string;
          description: string;
          duration_minutes: number | null;
          id: string;
          is_published: boolean;
          key_points: Json;
          module_number: number;
          pass_mark: number;
          quiz_data: Json;
          title: string;
          updated_at: string;
          video_url: string | null;
        };
        Insert: {
          category: string;
          content_markdown: string;
          created_at?: string;
          description: string;
          duration_minutes?: number | null;
          id?: string;
          is_published?: boolean;
          key_points?: Json;
          module_number: number;
          pass_mark?: number;
          quiz_data?: Json;
          title: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Update: {
          category?: string;
          content_markdown?: string;
          created_at?: string;
          description?: string;
          duration_minutes?: number | null;
          id?: string;
          is_published?: boolean;
          key_points?: Json;
          module_number?: number;
          pass_mark?: number;
          quiz_data?: Json;
          title?: string;
          updated_at?: string;
          video_url?: string | null;
        };
        Relationships: [];
      };
      incident_reports: {
        Row: {
          created_at: string;
          deployment_id: string | null;
          evidence_report_id: string | null;
          headline: string;
          id: string;
          incident_type: string;
          inec_notified: boolean;
          latitude: number | null;
          lga: string;
          longitude: number | null;
          narrative: string;
          observer_id: string;
          occurred_at: string;
          people_affected: number | null;
          polling_unit_name: string;
          resolution_note: string | null;
          security_notified: boolean;
          severity: string;
          state: string;
          status: string;
          triaged_at: string | null;
          triaged_by: string | null;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          created_at?: string;
          deployment_id?: string | null;
          evidence_report_id?: string | null;
          headline: string;
          id?: string;
          incident_type: string;
          inec_notified?: boolean;
          latitude?: number | null;
          lga: string;
          longitude?: number | null;
          narrative: string;
          observer_id: string;
          occurred_at?: string;
          people_affected?: number | null;
          polling_unit_name: string;
          resolution_note?: string | null;
          security_notified?: boolean;
          severity: string;
          state: string;
          status?: string;
          triaged_at?: string | null;
          triaged_by?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          created_at?: string;
          deployment_id?: string | null;
          evidence_report_id?: string | null;
          headline?: string;
          id?: string;
          incident_type?: string;
          inec_notified?: boolean;
          latitude?: number | null;
          lga?: string;
          longitude?: number | null;
          narrative?: string;
          observer_id?: string;
          occurred_at?: string;
          people_affected?: number | null;
          polling_unit_name?: string;
          resolution_note?: string | null;
          security_notified?: boolean;
          severity?: string;
          state?: string;
          status?: string;
          triaged_at?: string | null;
          triaged_by?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "incident_reports_deployment_id_fkey";
            columns: ["deployment_id"];
            isOneToOne: false;
            referencedRelation: "digeo_deployments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_reports_evidence_report_id_fkey";
            columns: ["evidence_report_id"];
            isOneToOne: false;
            referencedRelation: "iwitness_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "incident_reports_evidence_report_id_fkey";
            columns: ["evidence_report_id"];
            isOneToOne: false;
            referencedRelation: "my_iwitness_history";
            referencedColumns: ["id"];
          },
        ];
      };
      iwitness_media: {
        Row: {
          byte_size: number | null;
          created_at: string;
          duration_seconds: number | null;
          height: number | null;
          id: string;
          media_type: string;
          mime_type: string;
          report_id: string;
          sha256_hash: string | null;
          sort_order: number;
          storage_path: string;
          user_id: string;
          width: number | null;
        };
        Insert: {
          byte_size?: number | null;
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type: string;
          mime_type: string;
          report_id: string;
          sha256_hash?: string | null;
          sort_order?: number;
          storage_path: string;
          user_id: string;
          width?: number | null;
        };
        Update: {
          byte_size?: number | null;
          created_at?: string;
          duration_seconds?: number | null;
          height?: number | null;
          id?: string;
          media_type?: string;
          mime_type?: string;
          report_id?: string;
          sha256_hash?: string | null;
          sort_order?: number;
          storage_path?: string;
          user_id?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "iwitness_media_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "iwitness_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "iwitness_media_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "my_iwitness_history";
            referencedColumns: ["id"];
          },
        ];
      };
      iwitness_reports: {
        Row: {
          accuracy_meters: number | null;
          address: string;
          broadcast_slot: number | null;
          captured_at: string;
          created_at: string;
          description: string | null;
          device_info: Json;
          duration_seconds: number | null;
          expires_from_user_at: string;
          hidden_from_user_at: string | null;
          id: string;
          is_public_broadcast: boolean | null;
          is_realtime_capture: boolean;
          latitude: number | null;
          lga: string;
          longitude: number | null;
          media_type: string;
          media_url: string | null;
          nin: string | null;
          polling_unit: string | null;
          public_caption: string | null;
          reporter_name: string;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          severity_score: number | null;
          sha256_hash: string | null;
          state: string;
          status: string;
          storage_path: string | null;
          thumbnail_url: string | null;
          triage_category: string | null;
          user_id: string | null;
          ward: string | null;
        };
        Insert: {
          accuracy_meters?: number | null;
          address: string;
          broadcast_slot?: number | null;
          captured_at?: string;
          created_at?: string;
          description?: string | null;
          device_info?: Json;
          duration_seconds?: number | null;
          expires_from_user_at?: string;
          hidden_from_user_at?: string | null;
          id?: string;
          is_public_broadcast?: boolean | null;
          is_realtime_capture?: boolean;
          latitude?: number | null;
          lga: string;
          longitude?: number | null;
          media_type: string;
          media_url?: string | null;
          nin?: string | null;
          polling_unit?: string | null;
          public_caption?: string | null;
          reporter_name: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          severity_score?: number | null;
          sha256_hash?: string | null;
          state: string;
          status?: string;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          triage_category?: string | null;
          user_id?: string | null;
          ward?: string | null;
        };
        Update: {
          accuracy_meters?: number | null;
          address?: string;
          broadcast_slot?: number | null;
          captured_at?: string;
          created_at?: string;
          description?: string | null;
          device_info?: Json;
          duration_seconds?: number | null;
          expires_from_user_at?: string;
          hidden_from_user_at?: string | null;
          id?: string;
          is_public_broadcast?: boolean | null;
          is_realtime_capture?: boolean;
          latitude?: number | null;
          lga?: string;
          longitude?: number | null;
          media_type?: string;
          media_url?: string | null;
          nin?: string | null;
          polling_unit?: string | null;
          public_caption?: string | null;
          reporter_name?: string;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          severity_score?: number | null;
          sha256_hash?: string | null;
          state?: string;
          status?: string;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          triage_category?: string | null;
          user_id?: string | null;
          ward?: string | null;
        };
        Relationships: [];
      };
      live_streams: {
        Row: {
          category: string;
          created_at: string;
          ended_at: string | null;
          hls_url: string | null;
          id: string;
          is_approved: boolean;
          last_heartbeat_at: string | null;
          lga: string;
          livekit_identity: string | null;
          livekit_room: string | null;
          observer_id: string | null;
          observer_name: string;
          peak_viewers: number;
          polling_unit: string | null;
          priority: number;
          source: string;
          started_at: string | null;
          state: string;
          status: string;
          stream_title: string;
          stream_url: string | null;
          thumbnail_url: string | null;
          tile_slot: number | null;
          updated_at: string;
          viewer_count: number | null;
          ward: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          ended_at?: string | null;
          hls_url?: string | null;
          id?: string;
          is_approved?: boolean;
          last_heartbeat_at?: string | null;
          lga: string;
          livekit_identity?: string | null;
          livekit_room?: string | null;
          observer_id?: string | null;
          observer_name: string;
          peak_viewers?: number;
          polling_unit?: string | null;
          priority?: number;
          source?: string;
          started_at?: string | null;
          state: string;
          status?: string;
          stream_title: string;
          stream_url?: string | null;
          thumbnail_url?: string | null;
          tile_slot?: number | null;
          updated_at?: string;
          viewer_count?: number | null;
          ward?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          ended_at?: string | null;
          hls_url?: string | null;
          id?: string;
          is_approved?: boolean;
          last_heartbeat_at?: string | null;
          lga?: string;
          livekit_identity?: string | null;
          livekit_room?: string | null;
          observer_id?: string | null;
          observer_name?: string;
          peak_viewers?: number;
          polling_unit?: string | null;
          priority?: number;
          source?: string;
          started_at?: string | null;
          state?: string;
          status?: string;
          stream_title?: string;
          stream_url?: string | null;
          thumbnail_url?: string | null;
          tile_slot?: number | null;
          updated_at?: string;
          viewer_count?: number | null;
          ward?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          kind: string;
          link: string | null;
          read_at: string | null;
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          link?: string | null;
          read_at?: string | null;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          kind?: string;
          link?: string | null;
          read_at?: string | null;
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      observation_checklists: {
        Row: {
          accessible_to_pwd: boolean | null;
          accredited_voters: number | null;
          actual_open_time: string | null;
          bvas_present: boolean | null;
          bvas_zero_print_verified: boolean | null;
          created_at: string;
          deployment_id: string | null;
          ec8a_photo_path: string | null;
          ec8a_signed_by_agents: boolean | null;
          election_name: string;
          id: string;
          inec_officials_count: number | null;
          irregularities: string | null;
          latitude: number | null;
          lga: string;
          longitude: number | null;
          materials_complete: boolean | null;
          observed_at: string;
          observer_id: string;
          observer_remarks: string | null;
          opened_on_time: boolean | null;
          overall_rating: string | null;
          party_agents_count: number | null;
          phase: string;
          polling_unit_code: string | null;
          polling_unit_name: string;
          registered_voters: number | null;
          rejected_votes: number | null;
          results_posted_publicly: boolean | null;
          results_uploaded_to_irev: boolean | null;
          secret_ballot_respected: boolean | null;
          security_present: boolean | null;
          state: string;
          status: string;
          total_votes_cast: number | null;
          updated_at: string;
          valid_votes: number | null;
          verified_at: string | null;
          verified_by: string | null;
          voter_queue_orderly: boolean | null;
          ward: string | null;
        };
        Insert: {
          accessible_to_pwd?: boolean | null;
          accredited_voters?: number | null;
          actual_open_time?: string | null;
          bvas_present?: boolean | null;
          bvas_zero_print_verified?: boolean | null;
          created_at?: string;
          deployment_id?: string | null;
          ec8a_photo_path?: string | null;
          ec8a_signed_by_agents?: boolean | null;
          election_name: string;
          id?: string;
          inec_officials_count?: number | null;
          irregularities?: string | null;
          latitude?: number | null;
          lga: string;
          longitude?: number | null;
          materials_complete?: boolean | null;
          observed_at?: string;
          observer_id: string;
          observer_remarks?: string | null;
          opened_on_time?: boolean | null;
          overall_rating?: string | null;
          party_agents_count?: number | null;
          phase: string;
          polling_unit_code?: string | null;
          polling_unit_name: string;
          registered_voters?: number | null;
          rejected_votes?: number | null;
          results_posted_publicly?: boolean | null;
          results_uploaded_to_irev?: boolean | null;
          secret_ballot_respected?: boolean | null;
          security_present?: boolean | null;
          state: string;
          status?: string;
          total_votes_cast?: number | null;
          updated_at?: string;
          valid_votes?: number | null;
          verified_at?: string | null;
          verified_by?: string | null;
          voter_queue_orderly?: boolean | null;
          ward?: string | null;
        };
        Update: {
          accessible_to_pwd?: boolean | null;
          accredited_voters?: number | null;
          actual_open_time?: string | null;
          bvas_present?: boolean | null;
          bvas_zero_print_verified?: boolean | null;
          created_at?: string;
          deployment_id?: string | null;
          ec8a_photo_path?: string | null;
          ec8a_signed_by_agents?: boolean | null;
          election_name?: string;
          id?: string;
          inec_officials_count?: number | null;
          irregularities?: string | null;
          latitude?: number | null;
          lga?: string;
          longitude?: number | null;
          materials_complete?: boolean | null;
          observed_at?: string;
          observer_id?: string;
          observer_remarks?: string | null;
          opened_on_time?: boolean | null;
          overall_rating?: string | null;
          party_agents_count?: number | null;
          phase?: string;
          polling_unit_code?: string | null;
          polling_unit_name?: string;
          registered_voters?: number | null;
          rejected_votes?: number | null;
          results_posted_publicly?: boolean | null;
          results_uploaded_to_irev?: boolean | null;
          secret_ballot_respected?: boolean | null;
          security_present?: boolean | null;
          state?: string;
          status?: string;
          total_votes_cast?: number | null;
          updated_at?: string;
          valid_votes?: number | null;
          verified_at?: string | null;
          verified_by?: string | null;
          voter_queue_orderly?: boolean | null;
          ward?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "observation_checklists_deployment_id_fkey";
            columns: ["deployment_id"];
            isOneToOne: false;
            referencedRelation: "digeo_deployments";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          address: string | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          id: string;
          last_seen_at: string | null;
          latitude: number | null;
          lga: string | null;
          longitude: number | null;
          nin: string | null;
          nin_verified: boolean;
          notify_email: boolean;
          notify_push: boolean;
          phone: string | null;
          polling_unit: string | null;
          preferred_language: string;
          state: string | null;
          updated_at: string;
          ward: string | null;
        };
        Insert: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id: string;
          last_seen_at?: string | null;
          latitude?: number | null;
          lga?: string | null;
          longitude?: number | null;
          nin?: string | null;
          nin_verified?: boolean;
          notify_email?: boolean;
          notify_push?: boolean;
          phone?: string | null;
          polling_unit?: string | null;
          preferred_language?: string;
          state?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Update: {
          address?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          id?: string;
          last_seen_at?: string | null;
          latitude?: number | null;
          lga?: string | null;
          longitude?: number | null;
          nin?: string | null;
          nin_verified?: boolean;
          notify_email?: boolean;
          notify_push?: boolean;
          phone?: string | null;
          polling_unit?: string | null;
          preferred_language?: string;
          state?: string | null;
          updated_at?: string;
          ward?: string | null;
        };
        Relationships: [];
      };
      stream_comments: {
        Row: {
          author_avatar: string | null;
          author_name: string;
          body: string;
          channel: string;
          created_at: string;
          hidden_by: string | null;
          hidden_reason: string | null;
          id: string;
          is_hidden: boolean;
          is_pinned: boolean;
          stream_id: string | null;
          user_id: string;
        };
        Insert: {
          author_avatar?: string | null;
          author_name: string;
          body: string;
          channel?: string;
          created_at?: string;
          hidden_by?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_hidden?: boolean;
          is_pinned?: boolean;
          stream_id?: string | null;
          user_id: string;
        };
        Update: {
          author_avatar?: string | null;
          author_name?: string;
          body?: string;
          channel?: string;
          created_at?: string;
          hidden_by?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_hidden?: boolean;
          is_pinned?: boolean;
          stream_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stream_comments_stream_id_fkey";
            columns: ["stream_id"];
            isOneToOne: false;
            referencedRelation: "live_streams";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          granted_by: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          granted_by?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      my_iwitness_history: {
        Row: {
          address: string | null;
          created_at: string | null;
          description: string | null;
          duration_seconds: number | null;
          expires_from_user_at: string | null;
          id: string | null;
          is_public_broadcast: boolean | null;
          latitude: number | null;
          lga: string | null;
          longitude: number | null;
          media_type: string | null;
          media_url: string | null;
          polling_unit: string | null;
          reporter_name: string | null;
          severity_score: number | null;
          state: string | null;
          status: string | null;
          storage_path: string | null;
          triage_category: string | null;
          ward: string | null;
        };
        Insert: {
          address?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_seconds?: number | null;
          expires_from_user_at?: string | null;
          id?: string | null;
          is_public_broadcast?: boolean | null;
          latitude?: number | null;
          lga?: string | null;
          longitude?: number | null;
          media_type?: string | null;
          media_url?: string | null;
          polling_unit?: string | null;
          reporter_name?: string | null;
          severity_score?: number | null;
          state?: string | null;
          status?: string | null;
          storage_path?: string | null;
          triage_category?: string | null;
          ward?: string | null;
        };
        Update: {
          address?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_seconds?: number | null;
          expires_from_user_at?: string | null;
          id?: string | null;
          is_public_broadcast?: boolean | null;
          latitude?: number | null;
          lga?: string | null;
          longitude?: number | null;
          media_type?: string | null;
          media_url?: string | null;
          polling_unit?: string | null;
          reporter_name?: string | null;
          severity_score?: number | null;
          state?: string | null;
          status?: string | null;
          storage_path?: string | null;
          triage_category?: string | null;
          ward?: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      expire_iwitness_user_history: { Args: never; Returns: number };
      grant_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_admin: { Args: never; Returns: boolean };
      is_broadcast_operator: { Args: never; Returns: boolean };
      is_staff: { Args: never; Returns: boolean };
      is_super_admin: { Args: never; Returns: boolean };
      list_platform_users: {
        Args: never;
        Returns: {
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          last_sign_in_at: string;
          lga: string;
          nin_verified: boolean;
          roles: Database["public"]["Enums"]["app_role"][];
          state: string;
        }[];
      };
      my_roles: {
        Args: never;
        Returns: Database["public"]["Enums"]["app_role"][];
      };
      report_stream_viewers: {
        Args: { _count: number; _stream_id: string };
        Returns: undefined;
      };
      revoke_user_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role:
        | "super_admin"
        | "admin"
        | "control_center_operator"
        | "observer_coordinator"
        | "digeo"
        | "reviewer"
        | "viewer";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "super_admin",
        "admin",
        "control_center_operator",
        "observer_coordinator",
        "digeo",
        "reviewer",
        "viewer",
      ],
    },
  },
} as const;
