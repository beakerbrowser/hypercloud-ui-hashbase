# Hypercloud Hashbase UI

Hashbase UI module for [hypercloud](https://github.com/datprotocol/hypercloud)

## Extra config

```yaml
stripe:
  secretKey:
  publishableKey:
```

## Development guidelines

### Colors

Use pre-defined colors when possible. If you ever run into a situation where you
need a different color, consider adding it as a variable in
[/assets/css/base/variables.less](https://github.com/beakerbrowser/hypercloud-ui-hashbase/blob/master/assets/css/base/variables.less).

Notable colors:

* `@blue` (primary brand color)
* `@color-bg`
* `@color-border--light-gray`
* `@color-border--gray`
* `@color-border--light-blue`
* `@color-text`

### z-index

Use @on-top for all

### Media queries

We use three variables with pre-defined widths in our media queries, @tablet-vertical, @tablet-horizontal, and @desktop. Feel free to add more if necessary. You can see them in action in [assets/css/layout/containers.less](https://github.com/beakerbrowser/hypercloud-ui-hashbase/blob/master/assets/css/layout/containers.less).

### Layout

Each page's main content should be encapsulated within a `<main
class="page-name"></main>` and `<div class="container"></div>` element.

Example:

```html
<main class="about">
  <div class="container">
    <!-- about page content -->
  </div>
</main>
```

#### Containers

The container class handles responsive resizing and padding. All content must be
contained within a `.container` element. Add `.medium` or `.small` to that
element to adjust the `max-width` of the container.

### Buttons

Add the `.btn` class to a button or anchor to apply base button styles.

Other buttons:

* `.primary`: blue button used for most submit buttons
* `.success`: green button used for submit actions that *create* something
* `.outline`: button with border that inherits it's containers text color
* `.transparent` (may not keep, try not to use)

### Links

At the moment, the `.link` extend applies `text-decoration: underline`. While it
may be tempting to simply apply that style manually when you need to style an
element like a link, please use `&:extend(.link)` so that transitioning to other
link styles is seamless if we ever choose to do so.

### Pro tag

Add a "pro tag" anywhere by creating an element with the content "pro" and the
class `.pro-tag`.

### Logo

To add the logo, create an element with the content "#_hashbase" and add the
class `.hashbase-logo`. You should not ever need to override these styles.

The logo should never be underlined, and the font-size should never be less than
1.6rem.

### Forms

We currently have one form style that is used repeatedly acrosss the site:
`.form modal-form`.

#### Form heading

Example: `<h1 class="form-heading">Sign up for Hashbase</h1>`

#### Form description

Exmaple : `<p class="form-desc">Enter your email address to request a password
reset"/p>`

Add the `.bordered` class to the form description to separate the last form
description paragraph from the form inputs.

#### Form groups

Place input groups in an element with the class `.form-group`.

#### Form actions

Typically, a form will have two actions, submit the form or do an alternate
action. We place these actions in a `.actions` element like so:

```html
<div class="actions">
  <a href="/account" class="alternate-link">Go back to your account</a>
  <button type="submit" class="btn primary">Upgrade</button>
</div>
```

### Alerts

Add the `.alert` class to add a basic alert.

Additional alerts:

* `.primary`: a blue, general alert
* `.success`: a green alert to indidacte success
* `.warning`: a red alert to indicated an error

### Decorators

We have a number of decorators in
[/assets/css/utils/decorators.less](https://github.com/beakerbrowser/hypercloud-ui-hashbase/blob/master/assets/css/utils/decorators.less).

This includes styles for:

* a flexbox container
* rounded elements
* box shadow
* text shadow

Please `&:extend()` these classes to maintain consistency.
