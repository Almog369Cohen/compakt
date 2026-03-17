# Page snapshot

```yaml
- generic [ref=e1]:
  - alert [ref=e2]
  - generic [ref=e4]:
    - img [ref=e6]
    - heading "Compakt Admin" [level=1] [ref=e9]
    - paragraph [ref=e10]: התחברו כדי להמשיך
    - textbox "אימייל" [active] [ref=e12]
    - generic [ref=e13]:
      - textbox "סיסמה" [ref=e14]
      - button "הצג סיסמה" [ref=e15] [cursor=pointer]:
        - img [ref=e16]
    - button "כניסה" [ref=e19] [cursor=pointer]
    - button "אין לי חשבון → הרשמה" [ref=e20] [cursor=pointer]
    - button "שכחתי סיסמה" [ref=e21] [cursor=pointer]
    - generic [ref=e22]:
      - paragraph [ref=e23]: או התחברו עם
      - generic [ref=e24]:
        - button "Google" [ref=e25] [cursor=pointer]:
          - img [ref=e26]
          - text: Google
        - button "Facebook" [ref=e31] [cursor=pointer]:
          - img [ref=e32]
          - text: Facebook
        - button "Apple" [ref=e34] [cursor=pointer]:
          - img [ref=e35]
          - text: Apple
```