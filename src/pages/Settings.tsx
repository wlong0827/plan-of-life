import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Norm {
  id: string;
  norm_name: string;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
}

interface SortableNormProps {
  norm: Norm;
  onToggle: (id: string, currentState: boolean) => void;
  onDelete: (id: string, isDefault: boolean) => void;
}

function SortableNorm({ norm, onToggle, onDelete }: SortableNormProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: norm.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
    >
      <div className="flex items-center gap-3 flex-1">
        <button
          className="cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <p className="font-medium">{norm.norm_name}</p>
          {!norm.is_default && (
            <p className="text-sm text-muted-foreground">Custom</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Switch
          checked={norm.is_active}
          onCheckedChange={() => onToggle(norm.id, norm.is_active)}
        />
        {!norm.is_default && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(norm.id, norm.is_default)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </div>
  );
}

const DEFAULT_NORMS = [
  "Morning Offering",
  "Morning Prayer",
  "Holy Mass",
  "Angelus",
  "Visit To The Blessed Sacrament",
  "Holy Rosary",
  "Spiritual Reading",
  "Examination Of Conscience",
  "Three Purity Hail Maries",
];

const Settings = () => {
  const [norms, setNorms] = useState<Norm[]>([]);
  const [newNorm, setNewNorm] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchNorms();
  }, []);

  const fetchNorms = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_norms")
        .select("*")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // If no norms exist, create default ones
      if (!data || data.length === 0) {
        await initializeDefaultNorms(user.id);
        await fetchNorms();
        return;
      }

      setNorms(data);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultNorms = async (userId: string) => {
    const defaultNorms = DEFAULT_NORMS.map((norm, index) => ({
      user_id: userId,
      norm_name: norm,
      is_default: true,
      is_active: true,
      display_order: index + 1,
    }));

    const { error } = await supabase.from("user_norms").insert(defaultNorms);
    if (error) throw error;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = norms.findIndex((norm) => norm.id === active.id);
    const newIndex = norms.findIndex((norm) => norm.id === over.id);

    const newNorms = arrayMove(norms, oldIndex, newIndex);

    // Update display_order for all affected items
    const updatedNorms = newNorms.map((norm, index) => ({
      ...norm,
      display_order: index + 1,
    }));

    setNorms(updatedNorms);

    // Save to database
    try {
      const updates = updatedNorms.map((norm) => ({
        id: norm.id,
        display_order: norm.display_order,
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("user_norms")
          .update({ display_order: update.display_order })
          .eq("id", update.id);

        if (error) throw error;
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save order",
      });
      // Revert on error
      fetchNorms();
    }
  };

  const toggleNorm = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from("user_norms")
        .update({ is_active: !currentState })
        .eq("id", id);

      if (error) throw error;

      setNorms((prev) =>
        prev.map((norm) =>
          norm.id === id ? { ...norm, is_active: !currentState } : norm
        )
      );

      toast({
        title: "Success",
        description: "Norm updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const addCustomNorm = async () => {
    if (!newNorm.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a norm name",
      });
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get the highest display_order
      const maxOrder = norms.reduce((max, norm) => Math.max(max, norm.display_order), 0);

      const { data, error } = await supabase
        .from("user_norms")
        .insert({
          user_id: user.id,
          norm_name: newNorm.trim(),
          is_default: false,
          is_active: true,
          display_order: maxOrder + 1,
        })
        .select()
        .single();

      if (error) throw error;

      setNorms((prev) => [...prev, data]);
      setNewNorm("");

      toast({
        title: "Success",
        description: "Custom norm added successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const deleteNorm = async (id: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot delete default norms. You can disable them instead.",
      });
      return;
    }

    try {
      const { error } = await supabase.from("user_norms").delete().eq("id", id);

      if (error) throw error;

      setNorms((prev) => prev.filter((norm) => norm.id !== id));

      toast({
        title: "Success",
        description: "Custom norm deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Manage Norms</h2>
          <p className="text-sm text-muted-foreground">
            Drag and drop to reorder your norms
          </p>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={norms.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {norms.map((norm) => (
                  <SortableNorm
                    key={norm.id}
                    norm={norm}
                    onToggle={toggleNorm}
                    onDelete={deleteNorm}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Add Custom Norm</h2>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="new-norm">Norm Name</Label>
              <Input
                id="new-norm"
                placeholder="Enter custom norm name..."
                value={newNorm}
                onChange={(e) => setNewNorm(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomNorm()}
              />
            </div>
            <Button onClick={addCustomNorm} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Norm
            </Button>
          </div>
        </div>

        <div className="pt-6">
          <Button
            variant="outline"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate("/auth");
            }}
            className="w-full"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
