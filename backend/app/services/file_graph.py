import os
from pathlib import Path
from typing import Dict, List, Set, Optional, Tuple
from pydantic import BaseModel
from cachetools import TTLCache
from app.agent.context.user_context import get_kraid_dir, _get_dir_mtime
from app.services.wiki_links import extract_wiki_links, parse_frontmatter

FILE_TYPES = ("profile", "project", "task", "note", "reference", "feedback")

class FileNode(BaseModel):
    slug: str
    name: str
    type: str
    project: Optional[str] = None
    links: List[str]
    backlinks: List[str]
    filepath: Path

    class Config:
        arbitrary_types_allowed = True

class TreeNode(BaseModel):
    slug: str
    name: str
    type: str
    children: List['TreeNode']

class FileGraph:
    def __init__(self):
        self._cache = TTLCache(maxsize=1, ttl=3600)

    def _get_kraid_mtime(self) -> float:
        kraid_dir = get_kraid_dir()
        if not kraid_dir.exists():
            return 0.0
        return _get_dir_mtime(kraid_dir)

    def _build_graph(self) -> Dict[str, FileNode]:
        kraid_dir = get_kraid_dir()
        graph: Dict[str, FileNode] = {}
        
        for ftype in FILE_TYPES:
            type_dir = kraid_dir / ftype
            if not type_dir.exists():
                continue
            for filepath in type_dir.glob("*.md"):
                slug = filepath.stem
                try:
                    content = filepath.read_text(encoding="utf-8")
                except Exception:
                    continue
                
                fm, _ = parse_frontmatter(content)
                name = fm.get("name", slug)
                project = fm.get("project") or None
                links = extract_wiki_links(content)
                
                if slug not in graph:
                    graph[slug] = FileNode(
                        slug=slug,
                        name=name,
                        type=ftype,
                        project=project,
                        links=links,
                        backlinks=[],
                        filepath=filepath
                    )
        
        # Compute backlinks
        for slug, node in graph.items():
            for link in node.links:
                if link in graph and slug not in graph[link].backlinks:
                    graph[link].backlinks.append(slug)
                    
        return graph

    def get_graph(self) -> Dict[str, FileNode]:
        current_mtime = self._get_kraid_mtime()
        
        if "graph" in self._cache:
            cached_graph, cached_mtime = self._cache["graph"]
            if cached_mtime == current_mtime:
                return cached_graph

        graph = self._build_graph()
        self._cache["graph"] = (graph, current_mtime)
        return graph

    def get_tree(self) -> List[TreeNode]:
        graph = self.get_graph()
        
        roots = [slug for slug, node in graph.items() if not node.backlinks]
        
        if not roots and graph:
            sorted_slugs = sorted(graph.keys())
            roots = [sorted_slugs[0]]

        visited: Set[str] = set()
        
        def build_tree_node(slug: str) -> Optional[TreeNode]:
            if slug in visited:
                return None
            visited.add(slug)
            
            node_data = graph[slug]
            children_nodes = []
            
            for link in node_data.links:
                if link in graph:
                    child_tree = build_tree_node(link)
                    if child_tree:
                        children_nodes.append(child_tree)
                        
            return TreeNode(
                slug=node_data.slug,
                name=node_data.name,
                type=node_data.type,
                children=children_nodes
            )

        tree = []
        for root_slug in sorted(roots):
            tree_node = build_tree_node(root_slug)
            if tree_node:
                tree.append(tree_node)
                
        unvisited = sorted(list(set(graph.keys()) - visited))
        for unvisited_slug in unvisited:
            tree_node = build_tree_node(unvisited_slug)
            if tree_node:
                tree.append(tree_node)
                
        return tree

file_graph_instance = FileGraph()
