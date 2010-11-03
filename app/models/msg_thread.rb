class MsgThread < ActiveRecord::Base
    has_many :posts
    has_one :first_post, :class_name => "Post", :conditions => "post_index = 0"
    belongs_to :user
    belongs_to :folder
    validates :title, :presence => true
end
