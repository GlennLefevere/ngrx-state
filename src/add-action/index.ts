import {chain, Rule, Tree} from '@angular-devkit/schematics';
import {enrichOptions} from '../utility/options';
import {copyFiles} from '../utility/copy-files';

export default function (options: AddActionSchematics): Rule {
    return (host: Tree) => {

        options = enrichOptions(host, options);

        return chain([
            copyFiles(options, './files', options.path)
        ]);
    }
}
