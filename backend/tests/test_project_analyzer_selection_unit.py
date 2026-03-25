from app.services import project_analyzer


def test_parse_file_selector_paths_accepts_markdown_bullets():
  available = {"src/server.js", "README.md", "models/user.js"}
  raw = "- src/server.js\n- README.md\n- models/user.js\n"
  selected = project_analyzer._parse_file_selector_paths(raw_text=raw, available_paths=available)
  assert selected == ["src/server.js", "README.md", "models/user.js"]


def test_parse_file_selector_paths_accepts_prefixed_paths():
  available = {"src/server.js", "README.md"}
  raw = '["Durvalm/Javascript-Games/src/server.js", "Durvalm/Javascript-Games/README.md"]'
  selected = project_analyzer._parse_file_selector_paths(raw_text=raw, available_paths=available)
  assert selected == ["src/server.js", "README.md"]


def test_parse_file_selector_paths_accepts_case_mismatch():
  available = {"README.md", "Games/Pong/main.js"}
  raw = '["readme.md", "games/pong/main.js"]'
  selected = project_analyzer._parse_file_selector_paths(raw_text=raw, available_paths=available)
  assert selected == ["README.md", "Games/Pong/main.js"]


def test_parse_file_selector_paths_accepts_dots_and_backticks():
  available = {"src/server.js", "README.md"}
  raw = '["`./src/server.js`", "README.md,"]'
  selected = project_analyzer._parse_file_selector_paths(raw_text=raw, available_paths=available)
  assert selected == ["src/server.js", "README.md"]
