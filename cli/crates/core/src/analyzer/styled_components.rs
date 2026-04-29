pub const STYLED_COMPONENTS_MODULE_NAME: &str = "styled-components";
pub const STYLED_COMPONENTS_MACRO_MODULE_NAME: &str = "styled-components/macro";

pub const STYLED_COMPONENTS: &str = r#"
    export function styled() {
        return () => () => <div></div>;
    }

    // utilities
    export function createGlobalStyle() {
        return () => <div></div>;
    }

    export function withTheme() {
        return () => <div></div>;
    }

    export function ThemeProvider() {
        return () => <div></div>;
    }

    // tags
    function a() {
        return () => <div></div>;
    }

    function abbr() {
        return () => <div></div>;
    }

    function address() {
        return () => <div></div>;
    }

    function area() {
        return () => <div></div>;
    }

    function article() {
        return () => <div></div>;
    }

    function aside() {
        return () => <div></div>;
    }

    function audio() {
        return () => <div></div>;
    }

    function b() {
        return () => <div></div>;
    }

    function base() {
        return () => <div></div>;
    }

    function bdi() {
        return () => <div></div>;
    }

    function bdo() {
        return () => <div></div>;
    }

    function big() {
        return () => <div></div>;
    }

    function blockquote() {
        return () => <div></div>;
    }

    function body() {
        return () => <div></div>;
    }

    function br() {
        return () => <div></div>;
    }

    function button() {
        return () => <div></div>;
    }

    function canvas() {
        return () => <div></div>;
    }

    function caption() {
        return () => <div></div>;
    }

    function cite() {
        return () => <div></div>;
    }

    function code() {
        return () => <div></div>;
    }

    function col() {
        return () => <div></div>;
    }

    function colgroup() {
        return () => <div></div>;
    }

    function data() {
        return () => <div></div>;
    }

    function datalist() {
        return () => <div></div>;
    }

    function dd() {
        return () => <div></div>;
    }

    function del() {
        return () => <div></div>;
    }

    function details() {
        return () => <div></div>;
    }

    function dfn() {
        return () => <div></div>;
    }

    function dialog() {
        return () => <div></div>;
    }

    function div() {
        return () => <div></div>;
    }

    function dl() {
        return () => <div></div>;
    }

    function dt() {
        return () => <div></div>;
    }

    function em() {
        return () => <div></div>;
    }

    function embed() {
        return () => <div></div>;
    }

    function fieldset() {
        return () => <div></div>;
    }

    function figcaption() {
        return () => <div></div>;
    }

    function figure() {
        return () => <div></div>;
    }

    function footer() {
        return () => <div></div>;
    }

    function form() {
        return () => <div></div>;
    }

    function h1() {
        return () => <div></div>;
    }

    function h2() {
        return () => <div></div>;
    }

    function h3() {
        return () => <div></div>;
    }

    function h4() {
        return () => <div></div>;
    }

    function h5() {
        return () => <div></div>;
    }

    function h6() {
        return () => <div></div>;
    }

    function head() {
        return () => <div></div>;
    }

    function header() {
        return () => <div></div>;
    }

    function hgroup() {
        return () => <div></div>;
    }

    function hr() {
        return () => <div></div>;
    }

    function html() {
        return () => <div></div>;
    }

    function i() {
        return () => <div></div>;
    }

    function iframe() {
        return () => <div></div>;
    }

    function img() {
        return () => <div></div>;
    }

    function input() {
        return () => <div></div>;
    }

    function ins() {
        return () => <div></div>;
    }

    function kbd() {
        return () => <div></div>;
    }

    function keygen() {
        return () => <div></div>;
    }

    function label() {
        return () => <div></div>;
    }

    function legend() {
        return () => <div></div>;
    }

    function li() {
        return () => <div></div>;
    }

    function link() {
        return () => <div></div>;
    }

    function main() {
        return () => <div></div>;
    }

    function map() {
        return () => <div></div>;
    }

    function mark() {
        return () => <div></div>;
    }

    function menu() {
        return () => <div></div>;
    }

    function menuitem() {
        return () => <div></div>;
    }

    function meta() {
        return () => <div></div>;
    }

    function meter() {
        return () => <div></div>;
    }

    function nav() {
        return () => <div></div>;
    }

    function noindex() {
        return () => <div></div>;
    }

    function noscript() {
        return () => <div></div>;
    }

    function object() {
        return () => <div></div>;
    }

    function ol() {
        return () => <div></div>;
    }

    function optgroup() {
        return () => <div></div>;
    }

    function option() {
        return () => <div></div>;
    }

    function output() {
        return () => <div></div>;
    }

    function p() {
        return () => <div></div>;
    }

    function param() {
        return () => <div></div>;
    }

    function picture() {
        return () => <div></div>;
    }

    function pre() {
        return () => <div></div>;
    }

    function progress() {
        return () => <div></div>;
    }

    function q() {
        return () => <div></div>;
    }

    function rp() {
        return () => <div></div>;
    }

    function rt() {
        return () => <div></div>;
    }

    function ruby() {
        return () => <div></div>;
    }

    function s() {
        return () => <div></div>;
    }

    function samp() {
        return () => <div></div>;
    }

    function slot() {
        return () => <div></div>;
    }

    function script() {
        return () => <div></div>;
    }

    function section() {
        return () => <div></div>;
    }

    function select() {
        return () => <div></div>;
    }

    function small() {
        return () => <div></div>;
    }

    function source() {
        return () => <div></div>;
    }

    function span() {
        return () => <div></div>;
    }

    function strong() {
        return () => <div></div>;
    }

    function style() {
        return () => <div></div>;
    }

    function sub() {
        return () => <div></div>;
    }

    function summary() {
        return () => <div></div>;
    }

    function sup() {
        return () => <div></div>;
    }

    function table() {
        return () => <div></div>;
    }

    function template() {
        return () => <div></div>;
    }

    function tbody() {
        return () => <div></div>;
    }

    function td() {
        return () => <div></div>;
    }

    function textarea() {
        return () => <div></div>;
    }

    function tfoot() {
        return () => <div></div>;
    }

    function th() {
        return () => <div></div>;
    }

    function thead() {
        return () => <div></div>;
    }

    function time() {
        return () => <div></div>;
    }

    function title() {
        return () => <div></div>;
    }

    function tr() {
        return () => <div></div>;
    }

    function track() {
        return () => <div></div>;
    }

    function u() {
        return () => <div></div>;
    }

    function ul() {
        return () => <div></div>;
    }

    function varElement() {
        return () => <div></div>;
    }

    function video() {
        return () => <div></div>;
    }

    function wbr() {
        return () => <div></div>;
    }

    function webview() {
        return () => <div></div>;
    }

    function scExport() {
        const tags = {
            a,
            abbr,
            address,
            area,
            article,
            aside,
            audio,
            b,
            base,
            bdi,
            bdo,
            big,
            blockquote,
            body,
            br,
            button,
            canvas,
            caption,
            cite,
            code,
            col,
            colgroup,
            data,
            datalist,
            dd,
            del,
            details,
            dfn,
            dialog,
            div,
            dl,
            dt,
            em,
            embed,
            fieldset,
            figcaption,
            figure,
            footer,
            form,
            h1,
            h2,
            h3,
            h4,
            h5,
            h6,
            head,
            header,
            hgroup,
            hr,
            html,
            i,
            iframe,
            img,
            input,
            ins,
            kbd,
            keygen,
            label,
            legend,
            li,
            link,
            main,
            map,
            mark,
            menu,
            menuitem,
            meta,
            meter,
            nav,
            noindex,
            noscript,
            object,
            ol,
            optgroup,
            option,
            output,
            p,
            param,
            picture,
            pre,
            progress,
            q,
            rp,
            rt,
            ruby,
            s,
            samp,
            slot,
            script,
            section,
            select,
            small,
            source,
            span,
            strong,
            style,
            sub,
            summary,
            sup,
            table,
            template,
            tbody,
            td,
            textarea,
            tfoot,
            th,
            thead,
            time,
            title,
            tr,
            track,
            u,
            ul,
            var: varElement,
            video,
            wbr,
            webview
        };

        return tags;

        return styled;
    }

    export default scExport();
"#;
