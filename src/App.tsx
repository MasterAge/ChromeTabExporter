import React, {ChangeEvent} from 'react';
import './App.css';

enum TabFields {
    TITLE,
    URL,
    INDEX
}

interface AppState {
    tabs: Array<chrome.tabs.Tab>;
    delim: string;
    fieldOrder: Array<TabFields>
}

class App extends React.Component<{}, AppState> {

    constructor(props: Readonly<{}>) {
        super(props);
        this.state = {
            tabs: [],
            delim: " | ",
            fieldOrder: [TabFields.URL]
        }

        chrome.tabs.query({currentWindow: true})
            .then(tabList => this.setState({tabs: tabList}));
    }

    populateFields = (tab: chrome.tabs.Tab) => {
        return this.state.fieldOrder.map(field => {
            if (field == TabFields.URL) {
                return tab.url;
            } else if (field == TabFields.TITLE) {
                return tab.title;
            } else if (field == TabFields.INDEX) {
                return tab.index;
            }
        })
    }

    exportTabs = () => {
        const tabExport = this.state.tabs.map(tab => this.populateFields(tab).join(this.state.delim)).join("\n");
        navigator.clipboard.writeText(tabExport).then(() => {});
    }


    setDelim = (event: ChangeEvent<HTMLInputElement>) => {
        this.setState({delim: event.target.value})
    }

    render() {
        return (
            <div className="App">
                <h3 className="heading">Tab Export</h3>
                <div>
                    <span>Tab field separator: </span><input onChange={this.setDelim} className="delimInput"/>
                </div>
                <br />
                <button onClick={this.exportTabs}>Export Window's Tabs</button>
            </div>
        );
    }
}

export default App;
