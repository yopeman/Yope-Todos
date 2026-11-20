# Yope Todos Schema

### Projects

- id
- auth user id
- title
- description
- status
- link share permission: block, view, comment, edit
- order
- timestamps (created at, updated at, deleted at)

### Sections

- id
- project id
- parent section id: nullable (this refer only Section.parent_section_id === null)
- title
- description
- status
- order
- timestamps (created at, updated at, deleted at)

### Tasks

- id
- section id
- parent task id: nullable (this refer only Tasks.parent_task_id === null)
- title
- description
- attachment paths
- order
- status: pending, in progress, completed
- timestamps (created at, updated at, uploaded at, deleted at)

### Comments

- id
- task id
- auth user id
- comment
- attachment paths
- timestamps (created at, updated at, uploaded at, deleted at)

### Invitations

- id
- project id
- email
- permission: view, comment, edit
- status
- timestamps (created at, updated at, deleted at)
