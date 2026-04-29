pub use log::{debug, error, info, log_enabled, trace, Level, LevelFilter};
use log4rs::{
    append::{console::ConsoleAppender, file::FileAppender},
    config::{Appender, Root},
    encode::pattern::PatternEncoder,
    init_config, Config,
};

pub struct LoggerOptions<'a> {
    pub enable_console_logger: bool,
    pub enable_file_logger: bool,
    pub log_level: LevelFilter,
    pub file_path: Option<&'a str>,
}

pub fn get_filter_level(level_str: &str) -> LevelFilter {
    match level_str {
        "off" => LevelFilter::Off,
        "debug" => LevelFilter::Debug,
        "error" => LevelFilter::Error,
        "info" => LevelFilter::Info,
        "trace" => LevelFilter::Trace,
        "warn" => LevelFilter::Warn,
        _ => LevelFilter::Error,
    }
}

fn create_config(options: &LoggerOptions) -> Config {
    let log_file_path = options.file_path.unwrap_or("omlet-cli.log");

    let console_logger = ConsoleAppender::builder()
        .encoder(Box::new(PatternEncoder::new(
            "[{h({l})} {d(%m-%d %H:%M:%S%.3f)} {M}][RS] {m}{n}",
        )))
        .build();

    let file_logger = FileAppender::builder()
        .encoder(Box::new(PatternEncoder::new(
            "[{l} {d(%m-%d %H:%M:%S%.3f)}][RS] {m}{n}",
        )))
        .build(log_file_path)
        .unwrap();

    let config = Config::builder()
        .appender(Appender::builder().build("console_logger", Box::new(console_logger)))
        .appender(Appender::builder().build("file_logger", Box::new(file_logger)));

    let mut root_logger = Root::builder();

    root_logger = if options.enable_console_logger {
        root_logger.appender("console_logger")
    } else {
        root_logger
    };

    root_logger = if options.enable_file_logger {
        root_logger.appender("file_logger")
    } else {
        root_logger
    };

    config.build(root_logger.build(options.log_level)).unwrap()
}

pub fn init(options: LoggerOptions) {
    let config = create_config(&options);

    match init_config(config) {
        Ok(_) => {}
        Err(e) => {
            info!("Error while setting logger config {:#?}", e);
        }
    }
    info!("Logger initialized with level {}!", options.log_level);
}
