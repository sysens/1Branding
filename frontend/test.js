fetch('https://onebrandingbackend.up.railway.app/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'query LandingPage($locale: I18NLocaleCode) { landingPage(locale: $locale) { section2 { title countImage { url } } } }',
    variables: { locale: "en" }
  })
})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error);
