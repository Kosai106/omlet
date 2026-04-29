use logger::{get_filter_level, LoggerOptions};

mod cli;

#[cfg(feature = "dhat-heap")]
#[global_allocator]
static ALLOC: dhat::Alloc = dhat::Alloc;

fn main() {
    #[cfg(feature = "dhat-heap")]
    let _profiler = dhat::Profiler::new_heap();

    let cli = cli::Cli::init();

    let logger_options = LoggerOptions {
        enable_console_logger: true,
        enable_file_logger: true,
        file_path: Some("omlet-cli.log"),
        log_level: get_filter_level(cli.log_level.as_str()),
    };

    logger::init(logger_options);

    cli.run();
}
