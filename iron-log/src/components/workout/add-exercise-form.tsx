"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { guessMuscleGroup } from "@/lib/seed";
import { useIronLog } from "@/lib/store";
import { MUSCLE_GROUPS, MUSCLE_GROUP_LABELS, type Id, type MuscleGroup } from "@/lib/types";

/**
 * Add an exercise to the day currently open.
 *
 * The muscle group defaults to "تلقائي", which infers the group from the name at
 * submit time — so the volume-distribution chart stays meaningful without asking
 * the user to classify every lift they type.
 */
export function AddExerciseForm({ dayId }: { dayId: Id | null }) {
  const { actions } = useIronLog();
  const toast = useToast();

  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup | "auto">("auto");
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("اكتب اسم التمرين");
      return;
    }
    if (!dayId) {
      setError("اختر يوماً أولاً");
      return;
    }

    const result = actions.addExercise({
      name: trimmed,
      muscleGroup: group === "auto" ? guessMuscleGroup(trimmed) : group,
      dayId,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName("");
    setGroup("auto");
    setError(null);
    toast.success("تمت إضافة التمرين");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleAdd();
          }}
          placeholder="اسم تمرين جديد لهذا اليوم"
          aria-label="اسم التمرين الجديد"
          aria-invalid={error !== null}
          maxLength={120}
        />
        <Button onClick={handleAdd} className="shrink-0 px-4" aria-label="إضافة">
          <Plus className="size-4" aria-hidden />
          إضافة
        </Button>
      </div>

      <Select
        value={group}
        onChange={(event) =>
          setGroup(event.target.value as MuscleGroup | "auto")
        }
        aria-label="العضلة المستهدفة"
        className="h-10 text-[13px]"
      >
        <option value="auto">العضلة: تلقائي (من الاسم)</option>
        {MUSCLE_GROUPS.map((value) => (
          <option key={value} value={value}>
            {MUSCLE_GROUP_LABELS[value]}
          </option>
        ))}
      </Select>

      {error ? (
        <p role="alert" className="text-[11.5px] font-bold text-accent-glow">
          {error}
        </p>
      ) : null}
    </div>
  );
}
