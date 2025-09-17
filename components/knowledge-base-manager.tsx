"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Search, BookOpen } from "lucide-react"
import useSWR from "swr"

interface KnowledgeEntry {
  id: number
  category: string
  question: string
  answer: string
  is_active: boolean
  created_at: string
  updated_at: string
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const categories = ["company_info", "services", "pricing", "support", "general", "hours", "contact", "policies"]

export function KnowledgeBaseManager() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data, error: fetchError, mutate } = useSWR("/api/knowledge", fetcher)

  const knowledge: KnowledgeEntry[] = data?.knowledge || []

  // Filter knowledge entries
  const filteredKnowledge = knowledge.filter((entry) => {
    const matchesSearch =
      entry.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "all" || entry.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Group by category
  const groupedKnowledge = filteredKnowledge.reduce(
    (acc, entry) => {
      if (!acc[entry.category]) {
        acc[entry.category] = []
      }
      acc[entry.category].push(entry)
      return acc
    },
    {} as Record<string, KnowledgeEntry[]>,
  )

  const resetForm = () => {
    setFormData({
      category: "",
      question: "",
      answer: "",
      is_active: true,
    })
    setEditingEntry(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const url = editingEntry ? `/api/knowledge/${editingEntry.id}` : "/api/knowledge"
      const method = editingEntry ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to save entry")
      }

      mutate() // Refresh the data
      setIsAddDialogOpen(false)
      resetForm()
    } catch (error) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (entry: KnowledgeEntry) => {
    setEditingEntry(entry)
    setFormData({
      category: entry.category,
      question: entry.question,
      answer: entry.answer,
      is_active: entry.is_active,
    })
    setIsAddDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this entry?")) {
      return
    }

    try {
      const response = await fetch(`/api/knowledge/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete entry")
      }

      mutate() // Refresh the data
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete entry")
    }
  }

  const handleToggleActive = async (entry: KnowledgeEntry) => {
    try {
      const response = await fetch(`/api/knowledge/${entry.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !entry.is_active,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update entry")
      }

      mutate() // Refresh the data
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update entry")
    }
  }

  if (fetchError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load knowledge base. Please try again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Knowledge Base
          </h1>
          <p className="text-muted-foreground">Manage the AI agent's knowledge and responses</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Entry
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingEntry ? "Edit Knowledge Entry" : "Add Knowledge Entry"}</DialogTitle>
              <DialogDescription>
                {editingEntry
                  ? "Update the knowledge entry information."
                  : "Add a new entry to the AI agent's knowledge base."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="question" className="text-right">
                    Question
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="question"
                      value={formData.question}
                      onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                      placeholder="What question should trigger this response?"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="answer" className="text-right pt-2">
                    Answer
                  </Label>
                  <div className="col-span-3">
                    <Textarea
                      id="answer"
                      value={formData.answer}
                      onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                      placeholder="How should the AI agent respond?"
                      rows={4}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="is_active" className="text-right">
                    Active
                  </Label>
                  <div className="col-span-3">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : editingEntry ? "Update" : "Add Entry"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search questions, answers, or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="category-filter">Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge entries */}
      <div className="space-y-6">
        {Object.keys(groupedKnowledge).length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No entries found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || selectedCategory !== "all"
                    ? "Try adjusting your search or filter criteria."
                    : "Get started by adding your first knowledge base entry."}
                </p>
                {!searchTerm && selectedCategory === "all" && (
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Entry
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          Object.entries(groupedKnowledge).map(([category, entries]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                  <Badge variant="secondary">{entries.length} entries</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {entries.map((entry) => (
                    <div key={entry.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{entry.question}</h4>
                          <p className="text-sm text-muted-foreground mb-2">{entry.answer}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant={entry.is_active ? "default" : "secondary"}>
                              {entry.is_active ? "Active" : "Inactive"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Updated {new Date(entry.updated_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActive(entry)}
                            title={entry.is_active ? "Deactivate" : "Activate"}
                          >
                            <Switch checked={entry.is_active} />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(entry)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(entry.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
