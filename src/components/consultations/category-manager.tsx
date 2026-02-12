"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import { Plus, Settings, X } from "lucide-react";

export function CategoryManager() {
  const { data: categoriesData } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const categories = categoriesData?.data ?? [];

  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;

    setError("");
    try {
      await createCategory.mutateAsync(name);
      setNewName("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "추가에 실패했습니다");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "삭제에 실패했습니다");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <Settings className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>품목 관리</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 추가 입력 */}
          <div className="flex gap-2">
            <Input
              placeholder="새 품목명 입력"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button
              size="sm"
              onClick={handleAdd}
              disabled={!newName.trim() || createCategory.isPending}
            >
              <Plus className="mr-1 size-4" />
              추가
            </Button>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {/* 품목 태그 리스트 */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="gap-1 px-3 py-1.5 text-sm"
              >
                {cat.name}
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id)}
                  className="ml-1 rounded-full hover:bg-muted-foreground/20"
                  disabled={deleteCategory.isPending}
                >
                  <X className="size-3" />
                </button>
              </Badge>
            ))}
            {categories.length === 0 && (
              <p className="text-sm text-muted-foreground">
                등록된 품목이 없습니다
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
