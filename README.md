# search-box
TypeScript Search Box for a data stored on a server

## Installation

```bash
npm install @mishavetl/search-box
```

## Usage

```html
<label for="station">Station</label>
<input id="station" name="station" value="1" />

<script src="<search-box-path>/bundle.js"></script>
<script>
    const stationSearchBox = new SearchBox.SearchBox()
        .setUrl('<your-url>')
        .setTermProperty('station')
        .bindToInput(document.querySelector('#station'));
</script>
```
