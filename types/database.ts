export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          full_name: string | null
          email: string | null
          avatar_url: string | null
          phone: string | null
          address: string | null
          role: string | null
          credit_limit: number | null
          current_debt: number | null
          birth_date: string | null
          total_orders_count: number | null
          total_spent: number | null
        }
        Insert: {
          id: string
          created_at?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          role?: string | null
          credit_limit?: number | null
          current_debt?: number | null
          birth_date?: string | null
          total_orders_count?: number | null
          total_spent?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          full_name?: string | null
          email?: string | null
          avatar_url?: string | null
          phone?: string | null
          address?: string | null
          role?: string | null
          credit_limit?: number | null
          current_debt?: number | null
          birth_date?: string | null
          total_orders_count?: number | null
          total_spent?: number | null
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          created_at: string
          name: string
          contact_name: string | null
          phone: string | null
          email: string | null
          tax_id: string | null
          credit_days: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          tax_id?: string | null
          credit_days?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          contact_name?: string | null
          phone?: string | null
          email?: string | null
          tax_id?: string | null
          credit_days?: number | null
          notes?: string | null
        }
        Relationships: []
      }
      ingredients: {
        Row: {
          id: string
          created_at: string
          code: string | null
          name: string
          category: string
          unit: string
          current_stock: number
          min_stock: number
          max_stock: number
          cost_per_unit: number
          location: string | null
          expiration_date: string | null
          supplier_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          code?: string | null
          name: string
          category?: string
          unit?: string
          current_stock?: number
          min_stock?: number
          max_stock?: number
          cost_per_unit?: number
          location?: string | null
          expiration_date?: string | null
          supplier_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          code?: string | null
          name?: string
          category?: string
          unit?: string
          current_stock?: number
          min_stock?: number
          max_stock?: number
          cost_per_unit?: number
          location?: string | null
          expiration_date?: string | null
          supplier_id?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          created_at: string
          ingredient_id: string | null
          type: string
          quantity: number
          unit_cost: number
          reason: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          ingredient_id?: string | null
          type: string
          quantity: number
          unit_cost?: number
          reason?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          ingredient_id?: string | null
          type?: string
          quantity?: number
          unit_cost?: number
          reason?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          id: string
          created_at: string
          name: string | null
          description: string | null
          price: number | null
          image_url: string | null
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          servings: number | null
          difficulty: string | null
          category: string | null
          ingredients: Json | null
          instructions: Json | null
          is_published: boolean | null
          type: string | null
          yield_quantity: number | null
          yield_unit: string | null
          cost_per_unit: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          servings?: number | null
          difficulty?: string | null
          category?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_published?: boolean | null
          type?: string | null
          yield_quantity?: number | null
          yield_unit?: string | null
          cost_per_unit?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string | null
          description?: string | null
          price?: number | null
          image_url?: string | null
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          servings?: number | null
          difficulty?: string | null
          category?: string | null
          ingredients?: Json | null
          instructions?: Json | null
          is_published?: boolean | null
          type?: string | null
          yield_quantity?: number | null
          yield_unit?: string | null
          cost_per_unit?: number | null
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          id: string
          created_at: string
          recipe_id: string
          ingredient_id: string
          quantity: number
        }
        Insert: {
          id?: string
          created_at?: string
          recipe_id: string
          ingredient_id: string
          quantity: number
        }
        Update: {
          id?: string
          created_at?: string
          recipe_id?: string
          ingredient_id?: string
          quantity?: number
        }
        Relationships: []
      }
      recipe_sub_recipes: {
        Row: {
          id: string
          created_at: string
          parent_recipe_id: string
          child_recipe_id: string
          quantity: number
        }
        Insert: {
          id?: string
          created_at?: string
          parent_recipe_id: string
          child_recipe_id: string
          quantity: number
        }
        Update: {
          id?: string
          created_at?: string
          parent_recipe_id?: string
          child_recipe_id?: string
          quantity?: number
        }
        Relationships: []
      }
      restaurant_tables: {
        Row: {
          id: string
          number: string
          name: string | null
          capacity: number | null
          status: string | null
        }
        Insert: {
          id?: string
          number: string
          name?: string | null
          capacity?: number | null
          status?: string | null
        }
        Update: {
          id?: string
          number?: string
          name?: string | null
          capacity?: number | null
          status?: string | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          created_at: string
          updated_at: string | null
          order_number: number
          user_id: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_address: string | null
          table_id: string | null
          type: string | null
          status: string | null
          payment_status: string | null
          kitchen_status: string | null
          notes: string | null
          discount: number | null
          tax: number | null
          subtotal: number | null
          total: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          order_number?: number
          user_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          table_id?: string | null
          type?: string | null
          status?: string | null
          payment_status?: string | null
          kitchen_status?: string | null
          notes?: string | null
          discount?: number | null
          tax?: number | null
          subtotal?: number | null
          total?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          order_number?: number
          user_id?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_address?: string | null
          table_id?: string | null
          type?: string | null
          status?: string | null
          payment_status?: string | null
          kitchen_status?: string | null
          notes?: string | null
          discount?: number | null
          tax?: number | null
          subtotal?: number | null
          total?: number | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          created_at: string
          order_id: string
          recipe_id: string
          quantity: number
          unit_price: number
          subtotal: number
          notes: string | null
          kitchen_status: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          recipe_id: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          notes?: string | null
          kitchen_status?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          recipe_id?: string
          quantity?: number
          unit_price?: number
          subtotal?: number
          notes?: string | null
          kitchen_status?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          id: string
          name: string
          currency: string | null
          commission_percentage: number | null
          commission_fixed: number | null
          is_active: boolean | null
        }
        Insert: {
          id?: string
          name: string
          currency?: string | null
          commission_percentage?: number | null
          commission_fixed?: number | null
          is_active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          currency?: string | null
          commission_percentage?: number | null
          commission_fixed?: number | null
          is_active?: boolean | null
        }
        Relationships: []
      }
      order_payments: {
        Row: {
          id: string
          created_at: string
          order_id: string
          payment_method_id: string
          amount: number
          reference_number: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          order_id: string
          payment_method_id: string
          amount: number
          reference_number?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          order_id?: string
          payment_method_id?: string
          amount?: number
          reference_number?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      cash_registers: {
        Row: {
          id: string
          created_at: string
          closed_at: string | null
          opened_by: string
          closed_by: string | null
          initial_cash: number
          status: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          closed_at?: string | null
          opened_by: string
          closed_by?: string | null
          initial_cash?: number
          status?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          closed_at?: string | null
          opened_by?: string
          closed_by?: string | null
          initial_cash?: number
          status?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      cash_register_details: {
        Row: {
          id: string
          cash_register_id: string
          payment_method_id: string
          expected_amount: number
          real_amount: number
          difference: number
        }
        Insert: {
          id?: string
          cash_register_id: string
          payment_method_id: string
          expected_amount?: number
          real_amount?: number
          difference?: number
        }
        Update: {
          id?: string
          cash_register_id?: string
          payment_method_id?: string
          expected_amount?: number
          real_amount?: number
          difference?: number
        }
        Relationships: []
      }
      cash_expenses: {
        Row: {
          id: string
          created_at: string
          cash_register_id: string | null
          amount: number
          currency: string | null
          category: string
          recipient: string | null
          notes: string
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          cash_register_id?: string | null
          amount: number
          currency?: string | null
          category: string
          recipient?: string | null
          notes: string
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          cash_register_id?: string | null
          amount?: number
          currency?: string | null
          category?: string
          recipient?: string | null
          notes?: string
          created_by?: string | null
        }
        Relationships: []
      }
      bills_payable: {
        Row: {
          id: string
          created_at: string
          supplier_id: string
          invoice_number: string | null
          amount: number
          due_date: string
          status: string | null
          paid_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          supplier_id: string
          invoice_number?: string | null
          amount: number
          due_date: string
          status?: string | null
          paid_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          supplier_id?: string
          invoice_number?: string | null
          amount?: number
          due_date?: string
          status?: string | null
          paid_at?: string | null
          notes?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          created_at: string
          category: string
          type: string
          amount: number
          date: string
          description: string | null
          receipt_url: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          category: string
          type?: string
          amount: number
          date?: string
          description?: string | null
          receipt_url?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          category?: string
          type?: string
          amount?: number
          date?: string
          description?: string | null
          receipt_url?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      credit_payments: {
        Row: {
          id: string
          created_at: string
          customer_id: string
          amount: number
          payment_method_id: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          customer_id: string
          amount: number
          payment_method_id: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          customer_id?: string
          amount?: number
          payment_method_id?: string
          reference_number?: string | null
          notes?: string | null
          created_by?: string | null
        }
        Relationships: []
      }
      marketing_campaigns: {
        Row: {
          id: string
          created_at: string
          name: string
          type: string | null
          message: string
          target_audience: string | null
          status: string | null
          sent_at: string | null
          recipients_count: number | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          type?: string | null
          message: string
          target_audience?: string | null
          status?: string | null
          sent_at?: string | null
          recipients_count?: number | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          type?: string | null
          message?: string
          target_audience?: string | null
          status?: string | null
          sent_at?: string | null
          recipients_count?: number | null
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
