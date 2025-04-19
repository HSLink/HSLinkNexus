use crate::hslink_backend::HSLinkError;

pub fn find_bl() -> Result<String, HSLinkError> {
    Err(HSLinkError::NotSupport)
}
