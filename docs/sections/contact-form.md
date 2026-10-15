# Contact form — `sections/anvil-contact-form.liquid`

_Section card, 2026-10-14. Addable section, full chassis. Classes `.av-contact-form*`._

Shopify `contact` form: name, email (required), optional phone (`show_phone`), message (required). Labels from `anvil.contact_form.*`. Errors render in one alert block whose id the invalid fields reference (`aria-invalid`, `aria-describedby`); success shows `success_text` (info: promise only the reply time you can keep). `templates/page.contact.json` = main page → contact form → example FAQ.
